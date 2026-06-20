/**
 * Model tier configuration for workflow subagent model routing.
 *
 * A tier is a named slot (small/medium/big) holding exactly ONE model spec
 * string (e.g. "openai/gpt-4.1-mini"). When an agent() call specifies
 * opts.tier, that single model is resolved and used as the subagent's model
 * (unless an explicit opts.model is given, which always wins — see agent.ts).
 *
 * This augments the phase-pattern routing in model-routing.ts: phase routing
 * maps workflow phases → models via the script's meta; tiers give scripts a
 * coarse, user-configurable small/medium/big knob that is independent of any
 * concrete provider/model id.
 */
/**
 * Model tier configuration. Maps tier names (e.g. "small", "medium", "big")
 * to a single model spec string (e.g. "gpt-4.1-mini" or "openai/gpt-4.1-mini").
 */
export interface ModelTierConfig {
    tiers: Record<string, string>;
}
/** Path to the model tiers JSON config file (~/.pi/workflows/model-tiers.json). */
export declare function getModelTierConfigPath(): string;
/**
 * Build a default tier config where every tier points at a single model —
 * the user's currently active Pi model when known, else the first available
 * model. New users get consistent behaviour (every tier == the model they're
 * already chatting with) and can refine tiers later via `/workflows-models`.
 */
export declare function buildDefaultTierConfig(currentModelSpec?: string): ModelTierConfig;
/**
 * Load the model tier config from disk. Returns null if the file does not
 * exist or is unparseable (callers fall back to a default).
 */
export declare function loadModelTierConfig(configPath?: string): ModelTierConfig | null;
/**
 * Save a model tier config to disk. Creates parent directories if needed.
 */
export declare function saveModelTierConfig(config: ModelTierConfig, configPath?: string): void;
/**
 * Resolve a tier name to its configured model spec, or undefined if the tier
 * is not configured.
 */
export declare function resolveTierModel(tier: string, config: ModelTierConfig): string | undefined;
/** Return all tier names sorted: small < medium < big, then alphabetically. */
export declare function sortedTierNames(config: ModelTierConfig): string[];
