import type { ExtensionContext } from "@earendil-works/pi-coding-agent";
import type { AgentHistoryEntry } from "./agent-history.js";
import type { WorkflowErrorCode } from "./errors.js";
import type { WorkflowMeta } from "./workflow.js";
export type WorkflowAgentStatus = "queued" | "running" | "done" | "error" | "skipped";
export interface WorkflowAgentSnapshot {
    id: number;
    label: string;
    phase?: string;
    prompt: string;
    status: WorkflowAgentStatus;
    resultPreview?: string;
    error?: string;
    errorCode?: WorkflowErrorCode;
    recoverable?: boolean;
    history?: AgentHistoryEntry[];
    /** Tokens used by this agent. */
    tokens?: number;
    /** The model this agent ran on (provider/id), when known. */
    model?: string;
}
export interface WorkflowSnapshot {
    name: string;
    description?: string;
    phases: string[];
    currentPhase?: string;
    logs: string[];
    agents: WorkflowAgentSnapshot[];
    agentCount: number;
    runningCount: number;
    doneCount: number;
    errorCount: number;
    durationMs?: number;
    result?: unknown;
    tokenUsage?: {
        input: number;
        output: number;
        total: number;
        cost?: number;
        cacheRead?: number;
        cacheWrite?: number;
    };
    runId?: string;
}
export interface WorkflowDisplay {
    update(snapshot: WorkflowSnapshot): void;
    complete(snapshot: WorkflowSnapshot): void;
    clear(): void;
}
export interface WorkflowDisplayOptions {
    key?: string;
    placement?: "aboveEditor" | "belowEditor";
    maxAgents?: number;
    showStatus?: boolean;
    showResultPreviews?: boolean;
}
export declare function createWorkflowSnapshot(meta: WorkflowMeta): WorkflowSnapshot;
export declare function recomputeWorkflowSnapshot(snapshot: WorkflowSnapshot): WorkflowSnapshot;
export declare function createWidgetWorkflowDisplay(ctx: Pick<ExtensionContext, "ui" | "hasUI">, options?: WorkflowDisplayOptions): WorkflowDisplay;
export declare function createToolUpdateWorkflowDisplay(onUpdate: ((result: {
    content: Array<{
        type: "text";
        text: string;
    }>;
    details: unknown;
}) => void) | undefined, ctx?: Pick<ExtensionContext, "ui" | "hasUI">, options?: WorkflowDisplayOptions & {
    streamToolUpdates?: boolean;
}): WorkflowDisplay;
/** Minimal theme surface so rendering works without a real Theme (tool output, tests). */
export interface ThemeLike {
    fg(color: string, text: string): string;
    bold(text: string): string;
}
export declare function renderWorkflowLines(snapshot: WorkflowSnapshot, options?: WorkflowDisplayOptions, theme?: ThemeLike): string[];
export declare function renderWorkflowText(snapshot: WorkflowSnapshot, completed?: boolean): string;
export declare function preview(value: unknown, max?: number): string;
