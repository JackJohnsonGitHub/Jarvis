import type { TSchema } from "typebox";
import { WorkflowAgent, type WorkflowAgentOptions } from "./agent.js";
import type { AgentHistoryEntry } from "./agent-history.js";
import { type AgentRegistry } from "./agent-registry.js";
import { WorkflowErrorCode } from "./errors.js";
export interface WorkflowMetaPhase {
    title: string;
    detail?: string;
    model?: string;
}
export interface WorkflowMeta {
    name: string;
    description: string;
    phases?: WorkflowMetaPhase[];
    /** Default model for agents whose phase has no route and that set no model/tier. */
    model?: string;
}
/** One cached agent() result, keyed by its deterministic call index. */
export interface JournalEntry {
    index: number;
    /** sha256 of the call's identity (prompt + model + phase + agentType + schema). */
    hash: string;
    result: unknown;
}
/**
 * Global resources shared across a run and any workflow() nested inside it, so
 * the 16-concurrent / 1000-total caps and the token budget hold across nesting
 * instead of each level getting its own limiter and counters.
 */
export interface SharedRuntime {
    limiter: <T>(fn: () => Promise<T>) => Promise<T>;
    agentCount: number;
    spent: number;
    tokenUsage: {
        input: number;
        output: number;
        total: number;
        cost: number;
        cacheRead: number;
        cacheWrite: number;
    };
    depth: number;
}
export interface WorkflowRunOptions extends WorkflowAgentOptions {
    args?: unknown;
    agent?: Pick<WorkflowAgent, "run">;
    /** The session's main model (provider/id), shown in /workflows for default agents. */
    mainModel?: string;
    /**
     * Named subagent definitions for `agent({ agentType })`. Snapshotted once per
     * run for determinism. Defaults to scanning `.pi/agents` (project) + `~/.pi/agents`.
     * Injectable for tests.
     */
    agentRegistry?: AgentRegistry;
    concurrency?: number;
    tokenBudget?: number | null;
    signal?: AbortSignal;
    /** Maximum number of agents allowed in this run. Default: 1000 */
    maxAgents?: number;
    /** Timeout per agent in milliseconds. null/omitted means no hard timeout. */
    agentTimeoutMs?: number | null;
    /** Whether to persist logs to disk. Default: true */
    persistLogs?: boolean;
    /** Run ID for persistence. Auto-generated if not provided. */
    runId?: string;
    /** Resume: cached agent results keyed by deterministic call index. */
    resumeJournal?: Map<number, JournalEntry>;
    /** Resume: the run being resumed (informational; enables resume mode). */
    resumeFromRunId?: string;
    /** Called after each live agent completes so the caller can persist the journal. */
    onAgentJournal?: (entry: JournalEntry) => void;
    /** Internal: shared runtime inherited by a nested workflow() call. */
    sharedRuntime?: SharedRuntime;
    /** Resolve a saved-workflow name to its script, enabling `workflow('name', args)`. */
    loadSavedWorkflow?: (name: string) => string | undefined;
    /**
     * Ask the human a checkpoint() question and resolve to their reply. Threaded from
     * a UI-bearing tool context. Absent => headless: checkpoint() takes its declared
     * default (and journals it), so a detached/background run never hangs.
     */
    confirm?: (promptText: string, options: CheckpointOptions) => Promise<unknown>;
    onLog?: (message: string) => void;
    onPhase?: (title: string) => void;
    onAgentStart?: (event: {
        label: string;
        phase?: string;
        prompt: string;
        model?: string;
    }) => void;
    onAgentEnd?: (event: {
        label: string;
        phase?: string;
        result: unknown;
        tokens?: number;
        worktree?: string;
        model?: string;
        error?: string;
        errorCode?: WorkflowErrorCode;
        recoverable?: boolean;
    }) => void;
    onAgentHistory?: (event: {
        label: string;
        phase?: string;
        history: AgentHistoryEntry[];
    }) => void;
    onTokenUsage?: (usage: {
        input: number;
        output: number;
        total: number;
        cost: number;
        cacheRead?: number;
        cacheWrite?: number;
    }) => void;
}
export interface WorkflowRunResult<T = unknown> {
    meta: WorkflowMeta;
    result: T;
    logs: string[];
    phases: string[];
    agentCount: number;
    durationMs: number;
    runId?: string;
    tokenUsage?: {
        input: number;
        output: number;
        total: number;
        cost: number;
        cacheRead?: number;
        cacheWrite?: number;
    };
}
export interface AgentOptions<TSchemaDef extends TSchema | undefined = TSchema | undefined> {
    label?: string;
    phase?: string;
    schema?: TSchemaDef;
    /**
     * Run this agent on a specific model (`provider/modelId` or a bare `modelId`).
     * The workflow author chooses per-agent models per the routing policy in the
     * tool guidelines (e.g. a lighter model for exploration, the main model for
     * analysis). When omitted, the session's main model is used.
     */
    model?: string;
    /**
     * Coarse model tier ("small" | "medium" | "big"), resolved from the user's
     * model-tiers config (see /workflows-models). An explicit `model` takes
     * precedence; a tier takes precedence over the phase model. When the tier has
     * no configured entry it falls back to the session's main model.
     */
    tier?: string;
    isolation?: "worktree";
    /**
     * Name of a registered subagent definition (`.pi/agents/<name>.md`, project >
     * user). Binds that definition's tool allow/denylist, model, and body prompt
     * to this agent. An explicit `model` overrides the definition's model; the
     * definition's model overrides `tier`/phase. An unknown name logs a warning
     * and falls back to default tools/model (with the name as a prose hint).
     */
    agentType?: string;
    /** Override timeout for this specific agent. null means no hard timeout. */
    timeoutMs?: number | null;
}
/** Options for a human checkpoint() — a deterministic, journaled, replayable gate. */
export interface CheckpointOptions {
    /** Reply used when no UI is available (headless/background) and headless != "abort". */
    default?: unknown;
    /** Headless behavior: "default" (take `default`/true) or "abort" (throw). Default "default". */
    headless?: "default" | "abort";
    /** Confirm | free-text input | pick-one. Affects the hash and the UI widget. */
    kind?: "confirm" | "input" | "select";
    /** For kind "select". */
    choices?: string[];
    /** Per-checkpoint timeout in ms for the interactive prompt. */
    timeoutMs?: number;
}
export declare function runWorkflow<T = unknown>(script: string, options?: WorkflowRunOptions): Promise<WorkflowRunResult<T>>;
export declare function parseWorkflowScript(script: string): {
    meta: WorkflowMeta;
    body: string;
};
