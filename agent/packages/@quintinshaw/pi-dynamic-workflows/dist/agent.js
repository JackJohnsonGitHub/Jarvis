import { join } from "node:path";
import { AuthStorage, createAgentSession, createCodingTools, getAgentDir, ModelRegistry, SessionManager, SettingsManager, } from "@earendil-works/pi-coding-agent";
import { Check, Convert } from "typebox/value";
import { compactAgentHistory } from "./agent-history.js";
import { applyToolPolicy } from "./agent-registry.js";
import { WorkflowError, WorkflowErrorCode } from "./errors.js";
import { loadModelTierConfig, resolveTierModel } from "./model-tier-config.js";
import { createStructuredOutputTool } from "./structured-output.js";
/**
 * Find a JSON object/array in free-form text: a fenced ```json block if present,
 * else the first balanced {...} or [...]. Best-effort (the schema check is the
 * real gate). Returns the raw JSON string, or undefined when none is found.
 */
function findJsonBlock(text) {
    const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fence?.[1])
        return fence[1].trim();
    const start = text.search(/[{[]/);
    if (start === -1)
        return undefined;
    const open = text[start];
    const close = open === "{" ? "}" : "]";
    let depth = 0;
    for (let i = start; i < text.length; i++) {
        if (text[i] === open)
            depth++;
        else if (text[i] === close && --depth === 0)
            return text.slice(start, i + 1);
    }
    return undefined;
}
/**
 * Last-resort structured-output recovery: extract a JSON block from prose, coerce
 * it toward the schema, and accept it only if it then validates. Never fabricates
 * — returns undefined unless the parsed value genuinely satisfies the schema.
 */
export function extractValidated(text, schema) {
    const json = findJsonBlock(text);
    if (json === undefined)
        return undefined;
    let parsed;
    try {
        parsed = JSON.parse(json);
    }
    catch {
        return undefined;
    }
    try {
        const converted = Convert(schema, parsed);
        if (Check(schema, converted))
            return converted;
    }
    catch {
        // typebox can throw on exotic schemas; treat as no match.
    }
    return undefined;
}
/**
 * Resolve a schema agent's result. If the tool was called, return the captured
 * value. Otherwise re-prompt up to maxSchemaRetries (tools restricted to
 * structured_output), then try strict schema-validated prose extraction, else
 * throw SCHEMA_NONCOMPLIANCE (non-recoverable — surfaced, never a silent null).
 * Module-level with an injected `lastText` so it is unit-testable.
 */
export async function resolveStructuredOutput(session, capture, schema, options, lastText) {
    if (capture.called)
        return capture.value;
    const maxRetries = Math.max(0, options.maxSchemaRetries ?? 2);
    // Restrict to the schema tool so the only useful next action is calling it
    // (takes effect on the next prompt turn). Best-effort.
    try {
        session.setActiveToolsByName?.(["structured_output"]);
    }
    catch {
        // ignore — the re-prompt alone still drives most models to comply
    }
    for (let attempt = 0; attempt < maxRetries && !capture.called; attempt++) {
        if (options.signal?.aborted)
            throw new Error("Subagent was aborted");
        await session.prompt("You did not call the structured_output tool. Call structured_output now as your only action, with the required fields filled in. Do not write a prose answer.");
    }
    if (capture.called)
        return capture.value;
    const extracted = extractValidated(lastText(session.messages), schema);
    if (extracted !== undefined) {
        console.warn("[workflow] structured_output recovered from prose extraction (the model never called the tool); prefer a tool-reliable model");
        return extracted;
    }
    throw new WorkflowError("Subagent did not produce valid structured_output after repair attempts", WorkflowErrorCode.SCHEMA_NONCOMPLIANCE, { recoverable: false, agentLabel: options.label });
}
/**
 * Resolve which concrete model spec a subagent should use. Precedence, most
 * specific first:
 *   1. options.model — an explicit per-agent model (also carries agentType /
 *      phase model, which the workflow layer folds into options.model).
 *   2. options.tier  — resolved via the model-tiers config, falling back to the
 *      session's main model when the tier has no configured entry.
 *   3. DEFAULT TIER — when neither is set but the user has a model-tiers config,
 *      untagged agents default to the "medium" tier so a configured tier set
 *      actually affects the whole workflow (not just agents the script tagged).
 *      Fresh-install medium == the session model, so this is a no-op until the
 *      user customizes tiers via /workflows-models.
 * Returns undefined when nothing applies, so the session default is used.
 *
 * `loadConfig` is injectable for testing; it defaults to reading from disk.
 */
export function resolveAgentModelSpec(options, mainModel, loadConfig = loadModelTierConfig) {
    if (options.model)
        return options.model;
    const config = loadConfig();
    if (options.tier) {
        return (config ? resolveTierModel(options.tier, config) : undefined) ?? mainModel;
    }
    // Untagged agent: default to the configured medium tier when one exists.
    if (config) {
        const medium = resolveTierModel("medium", config);
        if (medium)
            return medium;
    }
    return undefined;
}
/**
 * List the user's currently available models (those with auth configured) as
 * `provider/modelId` specs. Used to tell the workflow author which models it may
 * route agents to. Best-effort: returns [] if the registry can't be built.
 */
export function listAvailableModelSpecs() {
    try {
        const dir = getAgentDir();
        const auth = AuthStorage.create(join(dir, "auth.json"));
        const registry = ModelRegistry.create(auth, join(dir, "models.json"));
        return registry.getAvailable().map((m) => `${m.provider}/${m.id}`);
    }
    catch {
        return [];
    }
}
export class WorkflowAgent {
    cwd;
    baseTools;
    sessionOptions;
    instructions;
    mainModel;
    /** Lazily built once; shares the SDK's agentDir/auth so resolved models are authed. */
    registry;
    constructor(options = {}) {
        this.cwd = options.cwd ?? process.cwd();
        this.baseTools = options.tools ?? createCodingTools(this.cwd);
        this.sessionOptions = options.session ?? {};
        this.instructions = options.instructions;
        this.mainModel = options.mainModel;
    }
    getRegistry() {
        if (!this.registry) {
            const dir = getAgentDir();
            // Same agentDir/auth files createAgentSession uses by default, so a model
            // resolved here carries valid credentials.
            const auth = AuthStorage.create(join(dir, "auth.json"));
            this.registry = ModelRegistry.create(auth, join(dir, "models.json"));
        }
        return this.registry;
    }
    /**
     * Resolve a model spec to a Model. Accepts `provider/modelId` (unambiguous)
     * or a bare `modelId` (prefers auth-configured models, then any known model).
     * Returns undefined when nothing matches.
     */
    resolveModel(spec) {
        const registry = this.getRegistry();
        const slash = spec.indexOf("/");
        if (slash > 0) {
            return registry.find(spec.slice(0, slash), spec.slice(slash + 1));
        }
        return registry.getAvailable().find((m) => m.id === spec) ?? registry.getAll().find((m) => m.id === spec);
    }
    async run(prompt, options = {}) {
        const capture = { called: false, value: undefined };
        // Per-call cwd (e.g. a worktree) needs coding tools bound to that directory,
        // since tools capture their cwd at construction and can't be relocated.
        const runCwd = options.cwd ?? this.cwd;
        const baseTools = runCwd === this.cwd ? this.baseTools : createCodingTools(runCwd);
        // Apply the agentType tool policy BEFORE adding structured_output, so a
        // restrictive allowlist never strips the schema tool.
        const customTools = applyToolPolicy([...baseTools, ...(options.tools ?? [])], options.toolNames, options.disallowedToolNames);
        if (options.schema) {
            customTools.push(createStructuredOutputTool({ schema: options.schema, capture }));
        }
        // Resolve the model spec (explicit model > tier > session default). This
        // composes with phase-based routing in workflow.ts, which only supplies
        // options.model when a phase pattern matches — so an explicit model wins.
        const modelSpec = resolveAgentModelSpec(options, this.mainModel);
        // Resolve a requested model spec to a Model object. A given-but-unresolved
        // spec falls back to the session default (with a warning) rather than failing.
        let resolvedModel;
        if (modelSpec) {
            resolvedModel = this.resolveModel(modelSpec);
            if (resolvedModel) {
                options.onModelResolved?.(`${resolvedModel.provider}/${resolvedModel.id}`);
            }
            else {
                console.warn(`[workflow] model "${modelSpec}" not found; using session default`);
                options.onModelFallback?.(modelSpec);
            }
        }
        const agentDir = getAgentDir();
        const { session } = await createAgentSession({
            cwd: runCwd,
            agentDir,
            sessionManager: SessionManager.inMemory(),
            // Use real SettingsManager to inherit user's default provider/model settings.
            // SettingsManager.inMemory() doesn't load ~/.pi/settings.json, so subagents
            // would fall back to the first available model (e.g. openai-codex) which may
            // not have valid auth, causing silent empty responses.
            settingsManager: SettingsManager.create(this.cwd, agentDir),
            customTools,
            ...this.sessionOptions,
            // Per-call model wins over any sessionOptions.model.
            ...(resolvedModel ? { model: resolvedModel } : {}),
        });
        let removeAbortListener;
        let removeHistoryListener;
        let lastHistoryEmit = 0;
        const emitHistory = () => options.onHistory?.(compactAgentHistory(session.messages));
        const maybeEmitHistory = () => {
            if (!options.onHistory)
                return;
            const now = Date.now();
            if (now - lastHistoryEmit < 250)
                return;
            lastHistoryEmit = now;
            emitHistory();
        };
        try {
            if (options.signal?.aborted)
                throw new Error("Subagent was aborted");
            if (options.signal) {
                const onAbort = () => void session.abort();
                options.signal.addEventListener("abort", onAbort, { once: true });
                removeAbortListener = () => options.signal?.removeEventListener("abort", onAbort);
            }
            if (options.onHistory) {
                removeHistoryListener = session.subscribe(() => maybeEmitHistory());
            }
            await session.prompt(this.buildPrompt(prompt, options, Boolean(options.schema)));
            if (options.signal?.aborted)
                throw new Error("Subagent was aborted");
            if (options.schema) {
                return (await resolveStructuredOutput(session, capture, options.schema, options, (m) => this.lastAssistantText(m)));
            }
            const text = this.lastAssistantText(session.messages);
            if (!text.trim()) {
                throw new WorkflowError("Subagent produced no assistant output", WorkflowErrorCode.AGENT_EMPTY_OUTPUT, {
                    recoverable: true,
                    agentLabel: options.label,
                });
            }
            return text;
        }
        finally {
            removeAbortListener?.();
            removeHistoryListener?.();
            try {
                emitHistory();
            }
            catch {
                // History is diagnostic only; never let it mask the real result/error.
            }
            // Read real usage before disposing — dispose tears down the session state.
            if (options.onUsage) {
                try {
                    const { tokens, cost } = session.getSessionStats();
                    options.onUsage({
                        input: tokens.input,
                        output: tokens.output,
                        cacheRead: tokens.cacheRead,
                        cacheWrite: tokens.cacheWrite,
                        total: tokens.total,
                        cost,
                    });
                }
                catch {
                    // Usage is best-effort; never let stats failure mask the real result/error.
                }
            }
            session.dispose();
        }
    }
    buildPrompt(prompt, options, structured) {
        const parts = [
            this.instructions,
            options.instructions,
            options.label ? `Task label: ${options.label}` : undefined,
            prompt,
        ].filter(Boolean);
        if (structured) {
            parts.push([
                "Final output contract:",
                "- Your final action MUST be a structured_output tool call.",
                "- The structured_output arguments are the return value of this subagent.",
                "- Do not emit a prose final answer instead of structured_output.",
                "- If you need to inspect files or run commands first, do so, then call structured_output exactly once.",
            ].join("\n"));
        }
        return parts.join("\n\n");
    }
    lastAssistantText(messages) {
        for (let i = messages.length - 1; i >= 0; i--) {
            const message = messages[i];
            if (message?.role !== "assistant" || !Array.isArray(message.content))
                continue;
            const text = message.content
                .filter((part) => part.type === "text")
                .map((part) => part.text)
                .join("");
            if (text.trim())
                return text;
        }
        return "";
    }
}
