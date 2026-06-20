import { type CreateAgentSessionOptions, type ToolDefinition } from "@earendil-works/pi-coding-agent";
import type { Static, TSchema } from "typebox";
import { type AgentHistoryEntry } from "./agent-history.js";
import { type ModelTierConfig } from "./model-tier-config.js";
import { type StructuredOutputCapture } from "./structured-output.js";
/**
 * Last-resort structured-output recovery: extract a JSON block from prose, coerce
 * it toward the schema, and accept it only if it then validates. Never fabricates
 * — returns undefined unless the parsed value genuinely satisfies the schema.
 */
export declare function extractValidated<T>(text: string, schema: TSchema): T | undefined;
/** Minimal session surface resolveStructuredOutput needs (real session or a test double). */
export interface StructuredSession {
    prompt(text: string): Promise<void>;
    setActiveToolsByName?(names: string[]): void;
    messages: unknown[];
}
/**
 * Resolve a schema agent's result. If the tool was called, return the captured
 * value. Otherwise re-prompt up to maxSchemaRetries (tools restricted to
 * structured_output), then try strict schema-validated prose extraction, else
 * throw SCHEMA_NONCOMPLIANCE (non-recoverable — surfaced, never a silent null).
 * Module-level with an injected `lastText` so it is unit-testable.
 */
export declare function resolveStructuredOutput<T>(session: StructuredSession, capture: StructuredOutputCapture<T>, schema: TSchema, options: {
    maxSchemaRetries?: number;
    signal?: AbortSignal;
    label?: string;
}, lastText: (messages: unknown[]) => string): Promise<T>;
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
export declare function resolveAgentModelSpec(options: {
    model?: string;
    tier?: string;
}, mainModel: string | undefined, loadConfig?: () => ModelTierConfig | null): string | undefined;
export interface WorkflowAgentOptions {
    cwd?: string;
    /** Extra tools available to the subagent in addition to the structured output tool. */
    tools?: ToolDefinition[];
    /** Override any createAgentSession option (model, authStorage, resourceLoader, etc.). */
    session?: Partial<CreateAgentSessionOptions>;
    /** Extra system guidance prepended to every subagent task. */
    instructions?: string;
    /**
     * The session's main model (`provider/modelId`). Used as a fallback when
     * resolving opts.tier and no model-tiers.json config exists. Without this,
     * a workflow using `{ tier: "small" }` would log a warning and fall through
     * to the session default when no config is saved yet.
     */
    mainModel?: string;
}
/**
 * List the user's currently available models (those with auth configured) as
 * `provider/modelId` specs. Used to tell the workflow author which models it may
 * route agents to. Best-effort: returns [] if the registry can't be built.
 */
export declare function listAvailableModelSpecs(): string[];
/** Real token/cost usage for a single subagent run, read from the SDK session. */
export interface AgentUsage {
    input: number;
    output: number;
    cacheRead: number;
    cacheWrite: number;
    total: number;
    cost: number;
}
export interface AgentRunOptions<TSchemaDef extends TSchema | undefined = undefined> {
    label?: string;
    schema?: TSchemaDef;
    tools?: ToolDefinition[];
    instructions?: string;
    signal?: AbortSignal;
    /**
     * Called once with this subagent's real usage, read from the session right
     * before disposal. Fires on both the success and error paths so partial
     * usage is never lost. `total === 0` means the provider reported no usage.
     */
    onUsage?: (usage: AgentUsage) => void;
    /**
     * Model spec for this subagent: either `provider/modelId` (unambiguous) or a
     * bare `modelId`. When it can't be resolved, the session default is used and
     * a warning is logged. When omitted, the session default applies.
     */
    model?: string;
    /**
     * Model tier name (e.g. "small", "medium", "big"). When set (and no explicit
     * `model` is given), the model is resolved from the user's model-tiers.json
     * config before `run()` starts, falling back to the session's main model when
     * the tier has no configured entry. An explicit `model` always takes priority,
     * so workflow scripts can use `{ tier: "small" }` for coarse routing without
     * caring which concrete model backs that tier.
     */
    tier?: string;
    /** Called with the resolved model id once known (for display/telemetry). */
    onModelResolved?: (modelId: string) => void;
    /** Called when `model`/`tier`/phase resolved to a spec that wasn't found (fell back to session default). */
    onModelFallback?: (requestedSpec: string) => void;
    /** Called with a compact snapshot of this subagent's message/tool history. */
    onHistory?: (history: AgentHistoryEntry[]) => void;
    /** Run this agent in a different working directory (e.g. an isolated worktree). */
    cwd?: string;
    /**
     * Restrict the subagent's coding tools to these names (an agentType
     * definition's `tools` allowlist). Undefined = all coding tools. The
     * structured_output tool is always added after this filter, so a schema
     * still works under a restrictive allowlist.
     */
    toolNames?: string[];
    /** Remove these coding-tool names after the allowlist (an agentType `disallowedTools` denylist). */
    disallowedToolNames?: string[];
    /**
     * With `schema`: how many extra repair turns to allow if the model finishes
     * without calling structured_output. Each retry re-prompts (tools restricted to
     * structured_output) before falling back to strict prose extraction. Default 2.
     */
    maxSchemaRetries?: number;
}
export type AgentRunResult<TSchemaDef extends TSchema | undefined> = TSchemaDef extends TSchema ? Static<TSchemaDef> : string;
export declare class WorkflowAgent {
    private readonly cwd;
    private readonly baseTools;
    private readonly sessionOptions;
    private readonly instructions?;
    private readonly mainModel?;
    /** Lazily built once; shares the SDK's agentDir/auth so resolved models are authed. */
    private registry?;
    constructor(options?: WorkflowAgentOptions);
    private getRegistry;
    /**
     * Resolve a model spec to a Model. Accepts `provider/modelId` (unambiguous)
     * or a bare `modelId` (prefers auth-configured models, then any known model).
     * Returns undefined when nothing matches.
     */
    private resolveModel;
    run<TSchemaDef extends TSchema | undefined = undefined>(prompt: string, options?: AgentRunOptions<TSchemaDef>): Promise<AgentRunResult<TSchemaDef>>;
    private buildPrompt;
    private lastAssistantText;
}
