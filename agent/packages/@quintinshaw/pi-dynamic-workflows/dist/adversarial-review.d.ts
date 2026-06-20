/**
 * Adversarial review mode for workflows.
 * Agents cross-check each other's findings for higher quality results.
 */
export interface AdversarialReviewConfig {
    /** Number of independent reviewers per finding. */
    reviewerCount: number;
    /** Whether to filter out findings that don't survive cross-checking. */
    filterContested: boolean;
    /** Minimum agreement threshold (0-1). */
    agreementThreshold: number;
}
/**
 * Generate an adversarial-review workflow. The script is static and reads its
 * inputs from `args` (task/reviewers/threshold) — no string interpolation.
 *
 * Each finding is judged independently by N reviewers who are told to REFUTE it;
 * a finding survives only when the share of reviewers calling it real meets the
 * agreement threshold.
 */
export declare function generateAdversarialReviewWorkflow(): string;
/**
 * Generate a multi-perspective analysis workflow.
 */
export declare function generateMultiPerspectiveWorkflow(topic: string, perspectives: string[]): string;
