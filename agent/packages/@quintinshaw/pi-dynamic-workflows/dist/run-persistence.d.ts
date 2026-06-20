/**
 * Workflow run state persistence for pause/resume support.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import type { AgentHistoryEntry } from "./agent-history.js";
import type { WorkflowErrorCode } from "./errors.js";
export type RunStatus = "pending" | "running" | "paused" | "completed" | "failed" | "aborted";
export interface PersistedAgentState {
    id: number;
    label: string;
    phase?: string;
    prompt: string;
    status: "queued" | "running" | "done" | "error" | "skipped";
    result?: unknown;
    error?: string;
    errorCode?: WorkflowErrorCode;
    recoverable?: boolean;
    history?: AgentHistoryEntry[];
    startedAt?: string;
    endedAt?: string;
    /** The model this agent ran on (provider/id), when known. */
    model?: string;
}
export interface PersistedRunState {
    runId: string;
    workflowName: string;
    script: string;
    args?: unknown;
    /** The pi session this run belongs to. Runs persist on disk across sessions but
     * the navigator shows only the current session's runs (undefined = legacy/global). */
    sessionId?: string;
    status: RunStatus;
    phases: string[];
    currentPhase?: string;
    agents: PersistedAgentState[];
    logs: string[];
    result?: unknown;
    startedAt: string;
    updatedAt: string;
    completedAt?: string;
    durationMs?: number;
    tokenUsage?: {
        input: number;
        output: number;
        total: number;
        cost?: number;
        cacheRead?: number;
        cacheWrite?: number;
    };
    /** Cached agent results for resume, keyed by deterministic call index. */
    journal?: Array<{
        index: number;
        hash: string;
        result: unknown;
    }>;
}
export interface RunPersistence {
    /** Save current run state. */
    save(state: PersistedRunState): void;
    /** Load a persisted run by ID. */
    load(runId: string): PersistedRunState | null;
    /** List all persisted runs. */
    list(): PersistedRunState[];
    /** Delete a persisted run. */
    delete(runId: string): boolean;
    /**
     * Acquire an exclusive cross-process lease for a run. Returns null when another
     * live process owns the run; stale/corrupt lock files are removed and retried.
     */
    acquireRunLease(runId: string): RunLease | null;
    /** Release a lease previously returned by acquireRunLease(). */
    releaseRunLease(lease: RunLease): void;
    /** Get runs directory path. */
    getRunsDir(): string;
}
export interface RunLease {
    runId: string;
    token: string;
}
/**
 * Filesystem operations used by run persistence.
 * Exposed for testing – pass overrides to inject mock implementations.
 */
export type FsLayer = {
    existsSync: typeof existsSync;
    mkdirSync: typeof mkdirSync;
    readdirSync: typeof readdirSync;
    readFileSync: typeof readFileSync;
    renameSync: typeof renameSync;
    unlinkSync: typeof unlinkSync;
    writeFileSync: typeof writeFileSync;
};
export declare function createRunPersistence(cwd: string, fsOverride?: Partial<FsLayer>): RunPersistence;
/**
 * Generate a unique run ID.
 */
export declare function generateRunId(): string;
