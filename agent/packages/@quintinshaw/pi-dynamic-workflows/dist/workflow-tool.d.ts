import { type ToolDefinition } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { WorkflowManager } from "./workflow-manager.js";
import { type WorkflowStorage } from "./workflow-saved.js";
/**
 * Model routing guideline for workflow authors.
 * Tells the LLM about opts.tier (small/medium/big) for runtime-enforced
 * model selection, and opts.model for an exact provider/id override.
 *
 * This string is injected into the workflow tool's promptGuidelines and
 * therefore appears in the LLM's system prompt for every workflow execution.
 */
export declare function modelRoutingGuideline(): string;
/**
 * Tells the LLM which named subagent definitions (agentType) are available, so
 * it can route an agent() to a reusable role that binds tools+model+prompt.
 * Returns undefined when no definitions are registered (nothing to advertise).
 */
export declare function agentTypeGuideline(cwd?: string): string | undefined;
declare const workflowToolSchema: Type.TObject<{
    script: Type.TString;
    args: Type.TOptional<Type.TAny>;
    background: Type.TOptional<Type.TBoolean>;
    maxAgents: Type.TOptional<Type.TNumber>;
    agentTimeoutMs: Type.TOptional<Type.TNumber>;
    tokenBudget: Type.TOptional<Type.TNumber>;
}>;
export type WorkflowToolInput = {
    script: string;
    args?: unknown;
    background?: boolean;
    maxAgents?: number;
    agentTimeoutMs?: number;
    tokenBudget?: number;
};
export interface WorkflowToolOptions {
    cwd?: string;
    concurrency?: number;
    /** Shared manager so background runs are reachable from the `/workflows` command. */
    manager?: WorkflowManager;
    /** Shared saved-workflow storage. */
    storage?: WorkflowStorage;
    /** Default per-agent timeout for runs created by this tool. null means no hard timeout. */
    defaultAgentTimeoutMs?: number | null;
}
export declare function createWorkflowTool(options?: WorkflowToolOptions): ToolDefinition<typeof workflowToolSchema, any>;
/**
 * The tool result returned when a workflow starts in the background. It both
 * informs the model and tells it to reassure the user: the run continues on its
 * own and the conversation will resume automatically when it finishes, so the
 * user can just wait here (or go do something else).
 */
export declare function backgroundStartedText(name: string, runId: string): string;
export {};
