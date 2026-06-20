/**
 * Workflow-specific error types.
 */
export declare enum WorkflowErrorCode {
    /** Agent exceeded timeout. */
    AGENT_TIMEOUT = "AGENT_TIMEOUT",
    /** Workflow was aborted by user. */
    WORKFLOW_ABORTED = "WORKFLOW_ABORTED",
    /** Agent limit exceeded. */
    AGENT_LIMIT_EXCEEDED = "AGENT_LIMIT_EXCEEDED",
    /** Token budget exhausted. */
    TOKEN_BUDGET_EXHAUSTED = "TOKEN_BUDGET_EXHAUSTED",
    /** Script validation failed. */
    SCRIPT_VALIDATION_ERROR = "SCRIPT_VALIDATION_ERROR",
    /** A schema agent never produced valid structured_output (after repair + extraction). */
    SCHEMA_NONCOMPLIANCE = "SCHEMA_NONCOMPLIANCE",
    /** A non-schema agent completed without any assistant text output. */
    AGENT_EMPTY_OUTPUT = "AGENT_EMPTY_OUTPUT",
    /** Agent execution failed. */
    AGENT_EXECUTION_ERROR = "AGENT_EXECUTION_ERROR",
    /** Run state persistence failed. */
    PERSISTENCE_ERROR = "PERSISTENCE_ERROR",
    /** Unknown error. */
    UNKNOWN = "UNKNOWN"
}
export declare class WorkflowError extends Error {
    readonly code: WorkflowErrorCode;
    readonly recoverable: boolean;
    readonly agentLabel?: string;
    readonly details?: unknown;
    constructor(message: string, code: WorkflowErrorCode, options?: {
        recoverable?: boolean;
        agentLabel?: string;
        details?: unknown;
    });
}
export declare function isWorkflowError(error: unknown): error is WorkflowError;
export declare function isAbortError(error: unknown): boolean;
export declare function isTimeoutError(error: unknown): boolean;
/**
 * Wrap an unknown error into a WorkflowError with appropriate classification.
 */
export declare function wrapError(error: unknown, context?: {
    agentLabel?: string;
}): WorkflowError;
