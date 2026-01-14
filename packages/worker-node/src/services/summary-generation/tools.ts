/**
 * Tools available to the summary generation agent
 */

export interface SummaryTool {
    name: string;
    description: string;
    execute: (params: Record<string, unknown>) => Promise<unknown>;
}

/**
 * Word count utilities
 */
export function countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Calculate reduction percentage
 */
export function calculateReduction(original: number, summary: number): string {
    const reduction = ((original - summary) / original) * 100;
    return `${reduction.toFixed(1)}%`;
}

/**
 * Style-specific configuration
 */
export const styleConfigs = {
    concise: {
        maxKeyPoints: 3,
        targetReduction: 80,
    },
    detailed: {
        maxKeyPoints: 7,
        targetReduction: 50,
    },
    'bullet-points': {
        maxKeyPoints: 10,
        targetReduction: 70,
    },
    executive: {
        maxKeyPoints: 5,
        targetReduction: 85,
    },
};
