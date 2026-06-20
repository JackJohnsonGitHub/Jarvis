/**
 * Configuration constants for pi-dynamic-workflows.
 */
/** Maximum number of agents allowed per workflow run. */
export declare const MAX_AGENTS_PER_RUN = 1000;
/** Default timeout for a single agent in milliseconds. null means no hard timeout. */
export declare const DEFAULT_AGENT_TIMEOUT_MS: null;
/** Maximum concurrent agents (matches Claude Code limit). */
export declare const MAX_CONCURRENCY = 16;
/** Default token budget if none specified. */
export declare const DEFAULT_TOKEN_BUDGET: null;
/** Legacy project-relative directory for persisted workflow run state. New writes use workflowProjectPaths(). */
export declare const WORKFLOW_RUNS_DIR = ".pi/workflows/runs";
/** Legacy project-relative directory for saved workflow commands. New writes use workflowProjectPaths(). */
export declare const WORKFLOW_SAVED_DIR = ".pi/workflows/saved";
/** User-level saved workflows directory. */
export declare const USER_WORKFLOW_SAVED_DIR = "~/.pi/workflows/saved";
/** User-level model tiers config file, relative to the home directory. */
export declare const MODEL_TIERS_FILE = ".pi/workflows/model-tiers.json";
/** User-level workflow extension settings file, relative to the home directory. */
export declare const WORKFLOW_SETTINGS_FILE = ".pi/workflows/settings.json";
/**
 * Named workflow subagent definitions directory. Resolved both project-relative
 * (cwd/.pi/agents) and home-relative (~/.pi/agents); project entries win on name
 * collision. Each `*.md` file is an agent definition (frontmatter + body prompt).
 */
export declare const AGENTS_DIR = ".pi/agents";
