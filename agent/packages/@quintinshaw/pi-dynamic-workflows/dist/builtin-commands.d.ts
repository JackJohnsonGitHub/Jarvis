/**
 * Bundled workflow commands: `/deep-research` and `/adversarial-review`.
 * They run a generated workflow script and print the final report.
 */
import { type ExtensionAPI } from "@earendil-works/pi-coding-agent";
export declare function registerBuiltinWorkflows(pi: ExtensionAPI, opts: {
    cwd: string;
}): void;
