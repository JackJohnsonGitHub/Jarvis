/**
 * User-level settings for pi-dynamic-workflows.
 *
 * Stored separately from Pi's own settings.json so extension preferences remain
 * stable without depending on host-internal config shape.
 */
export interface WorkflowSettings {
    keywordTriggerEnabled?: boolean;
    defaultAgentTimeoutMs?: number | null;
}
export interface WorkflowSettingsStore {
    load(): WorkflowSettings;
    save(settings: WorkflowSettings): void;
}
export interface WorkflowSettingsOptions {
    /** Explicit settings path, primarily for tests and migrations. */
    settingsPath?: string;
    /** Project cwd whose project-level settings should override global settings. */
    cwd?: string;
    /** Explicit project settings path, primarily for tests. */
    projectSettingsPath?: string;
    /** Save destination when using saveWorkflowSettings with cwd. Default: global. */
    scope?: "global" | "project";
}
/** Path to the user-level workflow settings JSON file (~/.pi/workflows/settings.json). */
export declare function getWorkflowSettingsPath(): string;
/** Path to this project's optional workflow settings override. */
export declare function getWorkflowProjectSettingsPath(cwd: string): string;
/** Load settings from disk. Missing, corrupt, or invalid files resolve to {}. */
export declare function loadWorkflowSettings(settingsPathOrOptions?: string | WorkflowSettingsOptions): WorkflowSettings;
/** Merge known settings into the user-level settings file. */
export declare function saveWorkflowSettings(settings: WorkflowSettings, settingsPathOrOptions?: string | WorkflowSettingsOptions): void;
/** Save a global preference and update an existing project override if one is present. */
export declare function saveWorkflowSettingsForCwd(settings: WorkflowSettings, cwd: string): void;
