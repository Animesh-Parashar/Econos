import { z } from 'zod';

/**
 * Input schema for summary generation service
 */
export const SummaryGenerationInputSchema = z.object({
    text: z.string().min(10).max(50000).describe('Text content to summarize'),
    maxLength: z.number().min(50).max(2000).optional().default(500).describe('Maximum summary length in characters'),
    style: z.enum(['concise', 'detailed', 'bullet-points', 'executive']).optional().default('concise'),
    focusAreas: z.array(z.string()).optional().describe('Specific topics to focus on'),
});

export type SummaryGenerationInput = z.infer<typeof SummaryGenerationInputSchema>;

/**
 * Output schema for summary generation service
 */
export const SummaryGenerationOutputSchema = z.object({
    summary: z.string().describe('The generated summary'),
    keyPoints: z.array(z.string()).describe('Key points extracted from the text'),
    wordCount: z.object({
        original: z.number(),
        summary: z.number(),
        reduction: z.string(),
    }),
    topics: z.array(z.string()).describe('Main topics identified'),
    sentiment: z.enum(['positive', 'negative', 'neutral', 'mixed']),
    metadata: z.object({
        style: z.string(),
        generatedAt: z.number(),
    }),
});

export type SummaryGenerationOutput = z.infer<typeof SummaryGenerationOutputSchema>;
