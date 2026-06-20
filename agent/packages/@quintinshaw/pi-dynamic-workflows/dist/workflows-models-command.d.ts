/**
 * `/workflows-models` command handler.
 *
 * Uses Pi's built-in `ctx.ui.select()`, `ctx.ui.confirm()`, and `ctx.ui.notify()`
 * to let users view and manage model tier configuration for workflows.
 *
 * Model selection draws from the same `listAvailableModelSpecs()` that powers
 * Pi's `/model` command, so users see exactly the same models.
 *
 * Each tier holds exactly one model spec string.
 * When editing a tier, a single-select picker is used (like Pi's `/model`).
 */
import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
/**
 * Register the `/workflows-models` command with Pi.
 */
export declare function registerWorkflowModelsCommand(pi: ExtensionAPI): void;
/**
 * Interactive editor for a single tier — scrollable model picker.
 *
 * Uses `ctx.ui.custom()` with Pi TUI's `SelectList` for proper
 * scrollable list with limited visible rows (like `/advisor`).
 *
 * The currently selected model is shown in the dialog title.
 * User scrolls with ↑↓, selects with Enter, cancels with Escape.
 *
 * Returns the updated tiers object, or null if nothing changed.
 */
export declare function editSingleTier(ctx: ExtensionCommandContext, tiers: Record<string, string>, tierName: string): Promise<Record<string, string> | null>;
