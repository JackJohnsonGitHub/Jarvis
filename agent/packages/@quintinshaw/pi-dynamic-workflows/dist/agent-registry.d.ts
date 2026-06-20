/**
 * Named workflow subagent definitions ("agentType" registry).
 *
 * A workflow script can route an agent() call to a reusable, named definition:
 *
 *   agent("audit this dir", { agentType: "security-auditor" })
 *
 * Definitions live as Markdown files under `.pi/agents/*.md` (project, cwd-relative)
 * and `~/.pi/agents/*.md` (user). Frontmatter binds the subagent's tools, model,
 * and a body prompt; project definitions win on a name collision. This mirrors
 * Claude Code's `.claude/agents` registry: agentType is a real binding of
 * tools+model+system-prompt, not a prose hint.
 *
 * Bound today: `tools` (allowlist), `disallowedTools` (denylist), `model`,
 * and the markdown body (`prompt`). Parsed-but-ignored for now (documented):
 * `mcp`, `skills`, `background`, `isolation` — each is wired independently later.
 */
export interface AgentDefinition {
    /** Stable identity used as the `agentType` value. */
    name: string;
    /** One-line summary (for discoverability in the tool guideline). */
    description?: string;
    /** Allowlist of coding-tool names the subagent may use. Undefined = all. */
    tools?: string[];
    /** Denylist of coding-tool names, applied after the allowlist. */
    disallowedTools?: string[];
    /** Model spec (`provider/modelId` or bare id) for this subagent. */
    model?: string;
    /** Markdown body, prepended to the subagent's task as role guidance. */
    prompt: string;
    /** Where the definition was loaded from (project wins over user). */
    source: "project" | "user";
}
export type AgentRegistry = Map<string, AgentDefinition>;
/**
 * Parse one agent-definition markdown file. Returns null only when there is no
 * usable content (no name derivable and an empty body).
 */
export declare function parseAgentDefinition(content: string, source: "project" | "user", fileName: string): AgentDefinition | null;
/**
 * Load the agent registry once for a run. Scans the project dir then the user
 * dir; the FIRST definition for a name wins (project > user, then filename
 * order), so a name collision is resolved deterministically and silently.
 *
 * `opts` overrides the scanned directories (used by tests).
 */
export declare function loadAgentRegistry(cwd: string, opts?: {
    projectDir?: string;
    userDir?: string;
}): AgentRegistry;
/** Resolve an agentType name to its definition, or undefined if not registered. */
export declare function resolveAgentType(name: string | undefined, registry: AgentRegistry): AgentDefinition | undefined;
/**
 * Apply a definition's tool policy to a tool list: keep only allowlisted names
 * (when an allowlist is given), then drop any denylisted names. Generic over any
 * object with a `name` so it is unit-testable without real ToolDefinitions.
 */
export declare function applyToolPolicy<T extends {
    name: string;
}>(tools: T[], allow?: string[], deny?: string[]): T[];
/**
 * A stable identity string for a resolved definition, folded into the resume
 * call-hash so editing an agent `.md` invalidates that call's cached result.
 */
export declare function agentDefinitionKey(def: AgentDefinition | undefined): string | null;
/** List registered agent types for discoverability in the tool guideline. */
export declare function listAgentTypes(registry: AgentRegistry): Array<{
    name: string;
    description?: string;
}>;
