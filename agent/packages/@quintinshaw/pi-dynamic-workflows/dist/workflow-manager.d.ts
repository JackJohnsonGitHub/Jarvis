/**
 * Workflow manager for background execution, pause/resume, and run management.
 */
import { EventEmitter } from "node:events";
import type { WorkflowAgent } from "./agent.js";
import { type WorkflowSnapshot } from "./display.js";
import { WorkflowError } from "./errors.js";
import { type PersistedRunState, type RunLease, type RunPersistence, type RunStatus } from "./run-persistence.js";
import { type JournalEntry, type WorkflowRunResult } from "./workflow.js";
export interface ManagedRun {
    runId: string;
    status: RunStatus;
    snapshot: WorkflowSnapshot;
    result?: WorkflowRunResult;
    error?: WorkflowError;
    controller: AbortController;
    startedAt: Date;
    /** The real script, kept so the run can be resumed. */
    script: string;
    args?: unknown;
    /** Accumulated agent results for resume (deterministic call index -> result). */
    journal: JournalEntry[];
    /** Cross-process execution lease for this run, when it is actively executing. */
    lease?: RunLease;
    /**
     * True when the run was started in the background (or resumed) and the caller is
     * not awaiting its result inline. Only background runs deliver their result back
     * into the conversation; a foreground sync run already returns it as the tool
     * result, so re-delivering would duplicate it.
     */
    background: boolean;
}
/** Per-execution options shared by sync, background, and resume runs. */
export interface ExecOptions {
    /** Replay these journaled agent results for the unchanged prefix (resume). */
    resumeJournal?: Map<number, JournalEntry>;
    /** Cap on total agents for this run. */
    maxAgents?: number;
    /** Per-agent timeout in milliseconds. null/omitted means no hard timeout. */
    agentTimeoutMs?: number | null;
    /** Host signal (e.g. tool/Esc) that should abort this run when fired. */
    externalSignal?: AbortSignal;
    /** Called with the live snapshot on every progress event. */
    onProgress?: (snapshot: WorkflowSnapshot) => void;
    /** Hard token budget for this run; once spent reaches it, agent() throws. */
    tokenBudget?: number | null;
    /** Resolve a checkpoint() question with a human reply (only for UI-bearing runs). */
    confirm?: (promptText: string, options: unknown) => Promise<unknown>;
}
export interface WorkflowManagerOptions {
    cwd?: string;
    concurrency?: number;
    /** Resolve a saved-workflow name to its script, enabling nested `workflow('name')`. */
    loadSavedWorkflow?: (name: string) => string | undefined;
    /** Inject a custom agent runner (tests); defaults to a real subagent session. */
    agent?: Pick<WorkflowAgent, "run">;
    /** The session's main model (provider/id), for auto-tiering explore agents. */
    mainModel?: string;
    /** The pi session id to tag runs with (see setSessionId). */
    sessionId?: string;
    /** Default per-agent timeout when a run does not pass agentTimeoutMs. null means no hard timeout. */
    defaultAgentTimeoutMs?: number | null;
}
export declare class WorkflowManager extends EventEmitter {
    private runs;
    private persistence;
    private cwd;
    private concurrency;
    private loadSavedWorkflow?;
    private agent?;
    /** The session's main model (provider/id), for auto-tiering explore agents. */
    private mainModel?;
    /** The current pi session id; runs are stamped with it and listRuns() filters by it. */
    private sessionId?;
    private defaultAgentTimeoutMs;
    constructor(options?: WorkflowManagerOptions);
    /** Bind the manager to the current pi session, so new runs are tagged with it and
     * the navigator/task-panel show only this session's runs (set on session_start). */
    setSessionId(id: string | undefined): void;
    /**
     * On startup, any persisted run still marked "running" belongs to a process
     * that died mid-run (this fresh manager has it nowhere in memory). Reconcile it
     * to "paused" — never "failed" — so its journal is preserved and resume() can
     * replay the completed prefix and finish the rest.
     */
    private recoverStaleRuns;
    /** Set the session's main model (provider/id). Used to auto-tier explore agents. */
    setMainModel(spec: string | undefined): void;
    /**
     * Start a workflow in the background.
     * Returns immediately with a run ID; the workflow executes asynchronously.
     */
    startInBackground(script: string, args?: unknown, exec?: ExecOptions): {
        runId: string;
        promise: Promise<WorkflowRunResult>;
    };
    /**
     * Execute a workflow synchronously (blocking) while still tracking it like a
     * background run, so the `/workflows` navigator and the live task panel see it.
     * `onProgress` fires on every progress event with the current snapshot, letting
     * a caller (e.g. the workflow tool) drive its own inline display.
     */
    runSync(script: string, args?: unknown, exec?: ExecOptions): Promise<WorkflowRunResult>;
    /** Build a fresh managed run with an empty snapshot. */
    private createManaged;
    private executeRun;
    private releaseRunLease;
    private persistRun;
    /**
     * Pause a running workflow.
     */
    pause(runId: string): boolean;
    /**
     * Resume an interrupted run: replay journaled results for the unchanged prefix
     * and run the rest live. Returns false if there is nothing resumable.
     */
    resume(runId: string): Promise<boolean>;
    /**
     * Stop a running workflow.
     */
    stop(runId: string): boolean;
    /**
     * Get status of a specific run.
     */
    getRun(runId: string): ManagedRun | undefined;
    /**
     * List all runs (active + persisted).
     */
    /**
     * Runs for the navigator/task panel. Once bound to a session (setSessionId), only
     * that session's runs are returned — runs from other sessions stay on disk and
     * reappear when you switch back. Unbound (tests/legacy) returns everything.
     */
    listRuns(): PersistedRunState[];
    /** All persisted runs regardless of session (used by cross-session recovery). */
    listAllRuns(): PersistedRunState[];
    /**
     * Get snapshot of a run.
     */
    getSnapshot(runId: string): WorkflowSnapshot | null;
    /**
     * Delete a persisted run.
     */
    deleteRun(runId: string): boolean;
    /**
     * Get the persistence layer (for saving workflows).
     */
    getPersistence(): RunPersistence;
}
