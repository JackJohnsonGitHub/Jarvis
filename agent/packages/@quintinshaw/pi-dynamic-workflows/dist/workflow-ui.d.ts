/**
 * Interactive `/workflows` navigator, modeled on Claude Code's view:
 *
 *   runs ──enter──▶ phases ──enter──▶ agents ──enter──▶ agent detail
 *        ◀──esc───        ◀──esc────         ◀──esc────
 *        ◀── (saved items in runs view) ──enter──▶ saved detail
 *
 * Keys: ↑/↓ (or j/k) select · enter/→ drill in · esc/← back (esc at top closes)
 *       On runs: p pause · x stop · r restart · s save · q quit
 *       On saved: x delete · q quit
 *
 * The state machine and line rendering are pure and unit-tested; the pi-tui
 * Component shell (openWorkflowNavigator) wires them to live manager events.
 */
import type { ExtensionAPI, ExtensionUIContext } from "@earendil-works/pi-coding-agent";
import type { WorkflowAgentSnapshot } from "./display.js";
import type { WorkflowManager } from "./workflow-manager.js";
import type { SavedWorkflow, WorkflowStorage } from "./workflow-saved.js";
/** Minimal theme surface so rendering is testable without the real Theme class. */
export interface ThemeLike {
    fg(color: string, text: string): string;
    bold(text: string): string;
}
export type ViewKind = "runs" | "phases" | "agents" | "detail" | "savedDetail";
export type ItemKind = "run" | "saved";
interface RunRow {
    runId: string;
    name: string;
    status: string;
    done: number;
    total: number;
    tokens: number;
    cost: number;
}
interface PhaseRow {
    title: string;
    done: number;
    total: number;
    tokens: number;
}
interface AgentRow {
    id: number;
    label: string;
    status: string;
    phase?: string;
    tokens?: number;
    model?: string;
}
/** Reads run/phase/agent data from the manager, preferring live snapshots. */
export declare class NavigatorModel {
    private readonly manager;
    private readonly storage?;
    constructor(manager: Pick<WorkflowManager, "listRuns" | "getRun">, storage?: {
        list(): SavedWorkflow[];
        delete(name: string, location?: string): boolean;
    } | undefined);
    private snapshot;
    runs(): RunRow[];
    /** Return saved workflows sorted by name, or [] when no storage configured. */
    saved(): SavedWorkflow[];
    /** Delete a saved workflow by name. */
    deleteSaved(name: string): boolean;
    runName(runId: string): string;
    runStatus(runId: string): string;
    phases(runId: string): PhaseRow[];
    agents(runId: string, phase: string): AgentRow[];
    agentDetail(runId: string, agentId: number): WorkflowAgentSnapshot | undefined;
}
/** Navigation state machine: a stack of (view, cursor) frames plus detail scroll. */
export declare class NavigatorState {
    private stack;
    scroll: number;
    private top;
    get kind(): ViewKind;
    get cursor(): number;
    set cursor(val: number);
    get runId(): string | undefined;
    get phase(): string | undefined;
    get agentId(): number | undefined;
    /** The saved workflow name at the cursor in savedDetail view */
    get savedName(): string | undefined;
    get depth(): number;
    /**
     * Determine what kind of item is at the given cursor position in the
     * runs view. Positions before runs.length are "run"; after are "saved".
     */
    itemKindAt(model: NavigatorModel, cursor: number): ItemKind;
    /** Clamp the cursor to [0, count). */
    clamp(count: number): void;
    move(delta: number, count: number): void;
    /** Drill into the selected item. Returns true if the view changed. */
    drill(model: NavigatorModel): boolean;
    /** Pop one level. Returns false when already at the top (caller should close). */
    back(): boolean;
    /** The runId at cursor, or undefined when on a saved item. */
    activeRunId(model: NavigatorModel): string | undefined;
}
/** Build the lines for the current view. Pure: depends only on state + model + theme. */
export declare function renderNavigator(state: NavigatorState, model: NavigatorModel, width: number, theme?: ThemeLike, viewportRows?: number): string[];
/** What a key press should do. Pure mapping from a parsed key id to an action. */
export type NavAction = {
    type: "move";
    delta: number;
} | {
    type: "drill";
} | {
    type: "back";
} | {
    type: "close";
} | {
    type: "pause";
} | {
    type: "stop";
} | {
    type: "restart";
} | {
    type: "save";
} | {
    type: "deleteSaved";
} | {
    type: "none";
};
export declare function keyToAction(keyId: string | undefined, kind: ViewKind, itemKind?: "run" | "saved"): NavAction;
import type { OverlayAnchor } from "@earendil-works/pi-tui";
export interface NavigatorOptions {
    storage?: WorkflowStorage;
    cwd?: string;
    /** Overlay anchor position: "center" (default) or "right-center" for sidebar. */
    anchor?: OverlayAnchor;
}
/**
 * Open the interactive `/workflows` navigator as a focused overlay. Resolves when
 * the user closes it (esc at the top level, or `q`).
 */
export declare function openWorkflowNavigator(pi: ExtensionAPI, manager: WorkflowManager, ui: ExtensionUIContext, opts?: NavigatorOptions): Promise<void>;
export {};
