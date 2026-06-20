/**
 * Workflow manager for background execution, pause/resume, and run management.
 */
import { EventEmitter } from "node:events";
import { preview } from "./display.js";
import { WorkflowError, WorkflowErrorCode } from "./errors.js";
import { createRunPersistence, generateRunId, } from "./run-persistence.js";
import { parseWorkflowScript, runWorkflow } from "./workflow.js";
export class WorkflowManager extends EventEmitter {
    runs = new Map();
    persistence;
    cwd;
    concurrency;
    loadSavedWorkflow;
    agent;
    /** The session's main model (provider/id), for auto-tiering explore agents. */
    mainModel;
    /** The current pi session id; runs are stamped with it and listRuns() filters by it. */
    sessionId;
    defaultAgentTimeoutMs;
    constructor(options = {}) {
        super();
        this.cwd = options.cwd ?? process.cwd();
        this.concurrency = options.concurrency ?? 8;
        this.loadSavedWorkflow = options.loadSavedWorkflow;
        this.agent = options.agent;
        this.mainModel = options.mainModel;
        this.sessionId = options.sessionId;
        this.defaultAgentTimeoutMs = options.defaultAgentTimeoutMs ?? null;
        this.persistence = createRunPersistence(this.cwd);
        this.recoverStaleRuns();
    }
    /** Bind the manager to the current pi session, so new runs are tagged with it and
     * the navigator/task-panel show only this session's runs (set on session_start). */
    setSessionId(id) {
        this.sessionId = id;
    }
    /**
     * On startup, any persisted run still marked "running" belongs to a process
     * that died mid-run (this fresh manager has it nowhere in memory). Reconcile it
     * to "paused" — never "failed" — so its journal is preserved and resume() can
     * replay the completed prefix and finish the rest.
     */
    recoverStaleRuns() {
        try {
            for (const p of this.listAllRuns()) {
                if (p.status === "running" && !this.runs.has(p.runId)) {
                    const lease = this.persistence.acquireRunLease(p.runId);
                    if (!lease)
                        continue;
                    try {
                        this.persistence.save({ ...p, status: "paused" });
                    }
                    finally {
                        this.persistence.releaseRunLease(lease);
                    }
                }
            }
        }
        catch {
            // Recovery is best-effort; never let it block manager construction.
        }
    }
    /** Set the session's main model (provider/id). Used to auto-tier explore agents. */
    setMainModel(spec) {
        this.mainModel = spec;
    }
    /**
     * Start a workflow in the background.
     * Returns immediately with a run ID; the workflow executes asynchronously.
     */
    startInBackground(script, args, exec = {}) {
        const runId = generateRunId();
        const controller = new AbortController();
        const parsed = parseWorkflowScript(script);
        const lease = this.persistence.acquireRunLease(runId);
        if (!lease)
            throw new Error(`Could not acquire workflow run lease for ${runId}`);
        const managed = {
            runId,
            status: "running",
            snapshot: {
                name: parsed.meta.name,
                description: parsed.meta.description,
                phases: parsed.meta.phases?.map((p) => p.title) ?? [],
                logs: [],
                agents: [],
                agentCount: 0,
                runningCount: 0,
                doneCount: 0,
                errorCount: 0,
            },
            controller,
            startedAt: new Date(),
            script,
            args,
            journal: [],
            background: true,
            lease,
        };
        this.runs.set(runId, managed);
        try {
            // Persist initial state
            this.persistence.save({
                runId,
                workflowName: parsed.meta.name,
                script,
                args,
                sessionId: this.sessionId,
                status: "running",
                phases: managed.snapshot.phases,
                agents: [],
                logs: [],
                startedAt: managed.startedAt.toISOString(),
                updatedAt: managed.startedAt.toISOString(),
            });
        }
        catch (err) {
            this.releaseRunLease(managed);
            this.runs.delete(runId);
            throw err;
        }
        // Run workflow asynchronously.
        // Attach a side-channel catch to prevent Node.js unhandled-rejection crashes
        // when a workflow is aborted/paused/stopped — executeRun()'s catch block
        // already records status/event/persist, but the promise still rejects.
        // The original promise is returned so callers can await it in try/catch.
        const promise = this.executeRun(managed, script, args, exec);
        promise.catch(() => { });
        return { runId, promise };
    }
    /**
     * Execute a workflow synchronously (blocking) while still tracking it like a
     * background run, so the `/workflows` navigator and the live task panel see it.
     * `onProgress` fires on every progress event with the current snapshot, letting
     * a caller (e.g. the workflow tool) drive its own inline display.
     */
    async runSync(script, args, exec = {}) {
        const managed = this.createManaged(script, args);
        const lease = this.persistence.acquireRunLease(managed.runId);
        if (!lease)
            throw new Error(`Could not acquire workflow run lease for ${managed.runId}`);
        managed.lease = lease;
        this.runs.set(managed.runId, managed);
        // Persist the initial state immediately so listRuns()/the task panel can see
        // the run the moment it starts, not only after the first agent journals.
        this.persistRun(managed);
        return this.executeRun(managed, script, args, exec);
    }
    /** Build a fresh managed run with an empty snapshot. */
    createManaged(script, args) {
        const parsed = parseWorkflowScript(script);
        return {
            runId: generateRunId(),
            status: "running",
            snapshot: {
                name: parsed.meta.name,
                description: parsed.meta.description,
                phases: parsed.meta.phases?.map((p) => p.title) ?? [],
                logs: [],
                agents: [],
                agentCount: 0,
                runningCount: 0,
                doneCount: 0,
                errorCount: 0,
            },
            controller: new AbortController(),
            startedAt: new Date(),
            script,
            args,
            journal: [],
            background: false,
        };
    }
    async executeRun(managed, script, args, exec = {}) {
        const { resumeJournal, maxAgents, agentTimeoutMs, externalSignal, onProgress, tokenBudget, confirm } = exec;
        const resolvedAgentTimeoutMs = agentTimeoutMs !== undefined ? agentTimeoutMs : this.defaultAgentTimeoutMs;
        const progress = () => onProgress?.(managed.snapshot);
        // Let a host abort (e.g. Esc during a blocking tool call) cancel this run.
        if (externalSignal) {
            if (externalSignal.aborted)
                managed.controller.abort();
            else
                externalSignal.addEventListener("abort", () => managed.controller.abort(), { once: true });
        }
        try {
            const result = await runWorkflow(script, {
                cwd: this.cwd,
                args,
                agent: this.agent,
                mainModel: this.mainModel,
                signal: managed.controller.signal,
                concurrency: this.concurrency,
                maxAgents,
                agentTimeoutMs: resolvedAgentTimeoutMs,
                tokenBudget,
                confirm,
                loadSavedWorkflow: this.loadSavedWorkflow,
                resumeJournal,
                resumeFromRunId: resumeJournal ? managed.runId : undefined,
                onAgentJournal: (entry) => {
                    // Append (crash-safe-ish): keep the latest entry per index, then persist.
                    managed.journal = managed.journal.filter((e) => e.index !== entry.index);
                    managed.journal.push(entry);
                    this.persistRun(managed);
                },
                onLog: (message) => {
                    managed.snapshot.logs.push(message);
                    this.emit("log", { runId: managed.runId, message });
                    progress();
                },
                onPhase: (title) => {
                    managed.snapshot.currentPhase = title;
                    if (!managed.snapshot.phases.includes(title)) {
                        managed.snapshot.phases.push(title);
                    }
                    this.emit("phase", { runId: managed.runId, title });
                    progress();
                },
                onAgentStart: (event) => {
                    managed.snapshot.agents.push({
                        id: managed.snapshot.agents.length + 1,
                        label: event.label,
                        phase: event.phase,
                        prompt: event.prompt,
                        status: "running",
                        model: event.model,
                    });
                    this.emit("agentStart", { runId: managed.runId, ...event });
                    progress();
                },
                onAgentEnd: (event) => {
                    const agent = [...managed.snapshot.agents]
                        .reverse()
                        .find((a) => a.label === event.label && a.status === "running");
                    if (agent) {
                        agent.status = event.result === null ? "error" : "done";
                        agent.resultPreview = preview(event.result);
                        agent.error = event.error;
                        agent.errorCode = event.errorCode;
                        agent.recoverable = event.recoverable;
                        agent.tokens = event.tokens;
                        if (event.model)
                            agent.model = event.model;
                    }
                    this.emit("agentEnd", { runId: managed.runId, ...event });
                    progress();
                },
                onAgentHistory: (event) => {
                    const agent = [...managed.snapshot.agents]
                        .reverse()
                        .find((a) => a.label === event.label && a.status === "running");
                    if (agent) {
                        agent.history = event.history;
                    }
                    this.emit("agentHistory", { runId: managed.runId, ...event });
                    progress();
                },
                onTokenUsage: (usage) => {
                    managed.snapshot.tokenUsage = usage;
                    this.emit("tokenUsage", { runId: managed.runId, usage });
                    progress();
                },
            });
            managed.status = "completed";
            managed.result = result;
            this.emit("complete", { runId: managed.runId, result });
            // Persist final state
            this.persistRun(managed);
            this.releaseRunLease(managed);
            return result;
        }
        catch (error) {
            const workflowError = error instanceof WorkflowError
                ? error
                : new WorkflowError(error instanceof Error ? error.message : String(error), WorkflowErrorCode.WORKFLOW_ABORTED, { recoverable: true });
            if (managed.controller.signal.aborted) {
                // Intentional abort (pause/stop/Esc) — preserve status set by pause()/stop()
                if (managed.status === "running") {
                    managed.status = "aborted";
                }
            }
            else {
                managed.status = "failed";
            }
            managed.error = workflowError;
            this.emit("error", { runId: managed.runId, error: workflowError });
            // Persist final state
            this.persistRun(managed);
            this.releaseRunLease(managed);
            throw workflowError;
        }
    }
    releaseRunLease(managed) {
        if (!managed.lease)
            return;
        this.persistence.releaseRunLease(managed.lease);
        managed.lease = undefined;
    }
    persistRun(managed) {
        try {
            this.persistence.save({
                runId: managed.runId,
                workflowName: managed.snapshot.name,
                // Persist the real script + journal so the run can be resumed. Runs live
                // in workflow run storage — protect via directory permissions, not blanking.
                script: managed.script,
                args: managed.args,
                sessionId: this.sessionId,
                journal: managed.journal,
                status: managed.status,
                phases: managed.snapshot.phases,
                currentPhase: managed.snapshot.currentPhase,
                agents: managed.snapshot.agents.map((a) => ({
                    ...a,
                    startedAt: managed.startedAt.toISOString(),
                    endedAt: new Date().toISOString(),
                })),
                logs: managed.snapshot.logs,
                result: managed.result?.result,
                tokenUsage: managed.snapshot.tokenUsage
                    ? {
                        input: managed.snapshot.tokenUsage.input,
                        output: managed.snapshot.tokenUsage.output,
                        total: managed.snapshot.tokenUsage.total,
                        cost: managed.snapshot.tokenUsage.cost,
                        cacheRead: managed.snapshot.tokenUsage.cacheRead,
                        cacheWrite: managed.snapshot.tokenUsage.cacheWrite,
                    }
                    : undefined,
                startedAt: managed.startedAt.toISOString(),
                updatedAt: new Date().toISOString(),
                completedAt: managed.status === "completed" ? new Date().toISOString() : undefined,
                durationMs: managed.result?.durationMs,
            });
        }
        catch (err) {
            // Persistence is best-effort: the run is still healthy in memory.
            // Log so an operator debugging state-loss has a lead, but never crash
            // the workflow over a disk-full situation.
            console.warn("[workflow-manager] Persist run failed:", err);
        }
    }
    /**
     * Pause a running workflow.
     */
    pause(runId) {
        const managed = this.runs.get(runId);
        if (managed?.status !== "running")
            return false;
        managed.controller.abort();
        managed.status = "paused";
        this.emit("paused", { runId });
        this.persistRun(managed);
        this.releaseRunLease(managed);
        return true;
    }
    /**
     * Resume an interrupted run: replay journaled results for the unchanged prefix
     * and run the rest live. Returns false if there is nothing resumable.
     */
    async resume(runId) {
        // Guard: refuse to resume a run that is already running, or one that was
        // intentionally aborted (pause/stop/Esc). Paused and failed runs can restart.
        const active = this.runs.get(runId);
        if (active?.status === "running")
            return false;
        if (active?.status === "aborted")
            return false;
        const persisted = this.persistence.load(runId);
        if (!persisted?.script || persisted.status === "completed" || persisted.status === "aborted")
            return false;
        const lease = this.persistence.acquireRunLease(runId);
        if (!lease)
            return false;
        const controller = new AbortController();
        const managed = {
            runId,
            status: "running",
            snapshot: {
                name: persisted.workflowName,
                phases: persisted.phases ?? [],
                logs: persisted.logs ?? [],
                agents: [],
                agentCount: 0,
                runningCount: 0,
                doneCount: 0,
                errorCount: 0,
            },
            controller,
            startedAt: new Date(),
            script: persisted.script,
            args: persisted.args,
            journal: persisted.journal ?? [],
            background: true,
            lease,
        };
        this.runs.set(runId, managed);
        const resumeJournal = new Map((persisted.journal ?? []).map((e) => [e.index, e]));
        this.emit("resumed", { runId });
        // Run in the background; executeRun records status/errors on the managed run.
        void this.executeRun(managed, persisted.script, persisted.args, { resumeJournal }).catch(() => { });
        return true;
    }
    /**
     * Stop a running workflow.
     */
    stop(runId) {
        const managed = this.runs.get(runId);
        if (!managed || (managed.status !== "running" && managed.status !== "paused"))
            return false;
        managed.controller.abort();
        managed.status = "aborted";
        this.emit("stopped", { runId });
        this.persistRun(managed);
        this.releaseRunLease(managed);
        return true;
    }
    /**
     * Get status of a specific run.
     */
    getRun(runId) {
        return this.runs.get(runId);
    }
    /**
     * List all runs (active + persisted).
     */
    /**
     * Runs for the navigator/task panel. Once bound to a session (setSessionId), only
     * that session's runs are returned — runs from other sessions stay on disk and
     * reappear when you switch back. Unbound (tests/legacy) returns everything.
     */
    listRuns() {
        const all = this.persistence.list();
        return this.sessionId ? all.filter((r) => r.sessionId === this.sessionId) : all;
    }
    /** All persisted runs regardless of session (used by cross-session recovery). */
    listAllRuns() {
        return this.persistence.list();
    }
    /**
     * Get snapshot of a run.
     */
    getSnapshot(runId) {
        return this.runs.get(runId)?.snapshot ?? null;
    }
    /**
     * Delete a persisted run.
     */
    deleteRun(runId) {
        const managed = this.runs.get(runId);
        if (managed)
            this.releaseRunLease(managed);
        this.runs.delete(runId);
        return this.persistence.delete(runId);
    }
    /**
     * Get the persistence layer (for saving workflows).
     */
    getPersistence() {
        return this.persistence;
    }
}
