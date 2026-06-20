/**
 * Workflow-specific error types.
 */
export var WorkflowErrorCode;
(function (WorkflowErrorCode) {
    /** Agent exceeded timeout. */
    WorkflowErrorCode["AGENT_TIMEOUT"] = "AGENT_TIMEOUT";
    /** Workflow was aborted by user. */
    WorkflowErrorCode["WORKFLOW_ABORTED"] = "WORKFLOW_ABORTED";
    /** Agent limit exceeded. */
    WorkflowErrorCode["AGENT_LIMIT_EXCEEDED"] = "AGENT_LIMIT_EXCEEDED";
    /** Token budget exhausted. */
    WorkflowErrorCode["TOKEN_BUDGET_EXHAUSTED"] = "TOKEN_BUDGET_EXHAUSTED";
    /** Script validation failed. */
    WorkflowErrorCode["SCRIPT_VALIDATION_ERROR"] = "SCRIPT_VALIDATION_ERROR";
    /** A schema agent never produced valid structured_output (after repair + extraction). */
    WorkflowErrorCode["SCHEMA_NONCOMPLIANCE"] = "SCHEMA_NONCOMPLIANCE";
    /** A non-schema agent completed without any assistant text output. */
    WorkflowErrorCode["AGENT_EMPTY_OUTPUT"] = "AGENT_EMPTY_OUTPUT";
    /** Agent execution failed. */
    WorkflowErrorCode["AGENT_EXECUTION_ERROR"] = "AGENT_EXECUTION_ERROR";
    /** Run state persistence failed. */
    WorkflowErrorCode["PERSISTENCE_ERROR"] = "PERSISTENCE_ERROR";
    /** Unknown error. */
    WorkflowErrorCode["UNKNOWN"] = "UNKNOWN";
})(WorkflowErrorCode || (WorkflowErrorCode = {}));
export class WorkflowError extends Error {
    code;
    recoverable;
    agentLabel;
    details;
    constructor(message, code, options = {}) {
        super(message);
        this.name = "WorkflowError";
        this.code = code;
        this.recoverable = options.recoverable ?? false;
        this.agentLabel = options.agentLabel;
        this.details = options.details;
    }
}
export function isWorkflowError(error) {
    return error instanceof WorkflowError;
}
export function isAbortError(error) {
    if (!(error instanceof Error))
        return false;
    return /\babort(?:ed)?\b/i.test(error.message);
}
export function isTimeoutError(error) {
    if (!(error instanceof Error))
        return false;
    return /\btimeout\b/i.test(error.message) || error.name === "TimeoutError";
}
/**
 * Wrap an unknown error into a WorkflowError with appropriate classification.
 */
export function wrapError(error, context) {
    if (isWorkflowError(error))
        return error;
    if (isAbortError(error)) {
        return new WorkflowError(error instanceof Error ? error.message : "Workflow was aborted", WorkflowErrorCode.WORKFLOW_ABORTED, { recoverable: true });
    }
    if (isTimeoutError(error)) {
        return new WorkflowError(error instanceof Error ? error.message : "Agent timed out", WorkflowErrorCode.AGENT_TIMEOUT, { recoverable: true, agentLabel: context?.agentLabel });
    }
    return new WorkflowError(error instanceof Error ? error.message : String(error), WorkflowErrorCode.AGENT_EXECUTION_ERROR, { recoverable: true, agentLabel: context?.agentLabel, details: error });
}
