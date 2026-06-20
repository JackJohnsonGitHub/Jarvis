export type AgentHistoryRole = "user" | "assistant" | "tool";
export type AgentHistoryKind = "text" | "toolCall" | "toolResult" | "error";
export interface AgentHistoryEntry {
    role: AgentHistoryRole;
    kind: AgentHistoryKind;
    text: string;
    toolName?: string;
    isError?: boolean;
    timestamp?: number;
}
export interface AgentHistoryOptions {
    maxEntries?: number;
    maxTextChars?: number;
    maxTotalChars?: number;
}
export declare function compactAgentHistory(messages: unknown[], options?: AgentHistoryOptions): AgentHistoryEntry[];
