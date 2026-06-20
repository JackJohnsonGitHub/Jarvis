/**
 * Background-run UX, mirroring Claude Code:
 *  - A live task panel below the input lists in-progress runs while you keep working.
 *    It is informational; run /workflows to open the full navigator.
 *  - When a background run finishes, its result is delivered back into the
 *    conversation so the paused task continues with the outcome.
 */
import type { ExtensionAPI, ExtensionUIContext, Theme } from "@earendil-works/pi-coding-agent";
import type { ManagedRun, WorkflowManager } from "./workflow-manager.js";
import type { WorkflowStorage } from "./workflow-saved.js";
export interface TaskPanelOptions {
    storage?: WorkflowStorage;
    cwd?: string;
}
export declare function deliverText(run: ManagedRun): string;
/**
 * When a background run finishes (or fails), deliver its result back into the
 * conversation AND continue the turn so the assistant can act on it — without
 * blocking the user meanwhile:
 *
 *  - `triggerTurn: true` starts a fresh turn when the agent is idle, feeding the
 *    result to the model so the paused conversation continues.
 *  - `deliverAs: "followUp"` means that if the user is busy in another turn, the
 *    result is queued and picked up after that turn finishes — never interrupting.
 *
 * Set up once per extension; idempotent via an internal guard.
 */
export declare function installResultDelivery(pi: ExtensionAPI, manager: WorkflowManager): void;
export declare function renderPanel(manager: WorkflowManager, theme: Theme, width?: number): string[];
/**
 * Install the live "workflows running" panel below the editor. Re-rendered on
 * every manager event. Informational only — the user opens the navigator with
 * /workflows. (`_pi`/`_opts` are kept for signature stability.)
 */
export declare function installTaskPanel(_pi: ExtensionAPI, manager: WorkflowManager, ui: ExtensionUIContext, _opts?: TaskPanelOptions): void;
