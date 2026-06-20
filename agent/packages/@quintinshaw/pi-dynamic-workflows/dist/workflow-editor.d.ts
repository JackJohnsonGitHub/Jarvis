/**
 * "Workflows mode" input affordance, à la a smart input box:
 *
 *  - While the editor text contains the word `workflow`/`workflows`, those letters
 *    render as a flowing rainbow, signalling that submitting will engage a workflow.
 *  - Pressing Backspace immediately after such a word toggles the highlight OFF
 *    (the word stays, but turns plain white) — a non-destructive "don't run a
 *    workflow after all". Re-typing a fresh trigger word turns it back on.
 *  - When the highlight is ON at submit time, the user's message is transformed to
 *    instruct Pi to actually run the workflow tool.
 *
 * Implementation: we replace the core editor with a thin subclass of the exported
 * `CustomEditor` (which itself extends pi-tui's `Editor`), overriding only
 * `render()` (to colorize) and `handleInput()` (for the Backspace toggle). All
 * other editor behavior — history, autocomplete, paste, undo, multiline — is
 * inherited untouched.
 */
import { CustomEditor, type ExtensionAPI, type ExtensionUIContext } from "@earendil-works/pi-coding-agent";
import type { EditorTheme, TUI } from "@earendil-works/pi-tui";
import { type EffortState } from "./effort-command.js";
import { type WorkflowSettingsStore } from "./workflow-settings.js";
/** 256-color ring cycling through the spectrum — shifted by a tick to "flow". */
export declare const RAINBOW: number[];
export declare function hasTrigger(text: string): boolean;
export declare function endsWithTrigger(textBeforeCursor: string): boolean;
/** Shared, mutable view of whether "workflows mode" is currently armed. */
export interface WorkflowModeState {
    active: boolean;
    keywordTriggerEnabled: boolean;
    suppressedKeywordText?: string;
}
export interface InstallWorkflowEditorOptions {
    settingsStore?: WorkflowSettingsStore;
}
interface AnsiToken {
    esc?: string;
    ch?: string;
}
/**
 * Split a rendered line into ANSI-escape tokens (passed through verbatim) and
 * single visible-character tokens. Handles CSI sequences (`\x1b[…m`, e.g. the
 * cursor's inverse-video) and APC/OSC string sequences (e.g. the zero-width
 * `CURSOR_MARKER` = `\x1b_pi:c\x07`) so colorization never corrupts them.
 */
export declare function tokenizeAnsi(line: string): AnsiToken[];
/**
 * Colorize every `workflow`/`workflows` occurrence in a rendered line with a
 * flowing rainbow, leaving all ANSI escapes (cursor, markers) intact. Returns the
 * line unchanged when it contains no trigger.
 */
export declare function colorizeWorkflow(line: string, tick: number, palette?: number[]): string;
/**
 * Editor that paints the trigger words and owns the on/off toggle. Reads/writes
 * `state.active` so the extension's `input` handler can decide whether to force a
 * workflow at submit time.
 */
export declare class WorkflowEditor extends CustomEditor {
    private readonly modeState;
    private tick;
    private timer?;
    /** Toggled off by Backspace-after-word; re-armed when a fresh trigger appears. */
    private disabled;
    private wasTriggered;
    constructor(tui: TUI, theme: EditorTheme, keybindings: ConstructorParameters<typeof CustomEditor>[2], modeState: WorkflowModeState);
    /** Highlighted/armed: a trigger is present and the user hasn't toggled it off. */
    isActive(): boolean;
    handleInput(data: string): void;
    render(width: number): string[];
    /** Absolute text before the cursor, used to detect "right after the word". */
    private cursorAfterTrigger;
    private syncState;
    private reconcileAnimation;
}
/**
 * The directive appended to a submitted message when workflows mode is armed.
 * `extraDirective` (e.g. an effort-tier nudge) is appended when present.
 */
export declare function buildForcedWorkflowPrompt(text: string, extraDirective?: string): string;
/**
 * Install the workflows-mode editor and the submit-time forcing hook.
 * Call once with the UI context (e.g. in `session_start`).
 */
/** The exact name of the workflow tool that workflows mode forces. */
export declare const WORKFLOW_TOOL_NAME = "workflow";
export declare function registerWorkflowTriggerCommand(pi: ExtensionAPI, state: WorkflowModeState, settingsStore?: WorkflowSettingsStore): void;
export declare function installWorkflowEditor(pi: ExtensionAPI, ui: ExtensionUIContext, effort?: EffortState, options?: InstallWorkflowEditorOptions): WorkflowModeState;
export {};
