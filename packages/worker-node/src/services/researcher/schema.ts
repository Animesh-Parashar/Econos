import { z } from 'zod';

export const ResearcherInputSchema = z.object({
    topic: z.string().min(3).max(500).describe('Research topic or question'),
    depth: z.enum(['quick', 'standard', 'deep']).optional().default('standard'),
    sources: z.array(z.string()).optional().describe('Preferred source types'),
    format: z.enum(['report', 'outline', 'qa']).optional().default('report'),
});

export type ResearcherInput = z.infer<typeof ResearcherInputSchema>;

export const ResearcherOutputSchema = z.object({
    findings: z.string().describe('Main research findings'),
    keyInsights: z.array(z.object({
        insight: z.string(),
        confidence: z.enum(['high', 'medium', 'low']),
    })),
    relatedTopics: z.array(z.string()),
    suggestedQuestions: z.array(z.string()),
    metadata: z.object({
        topic: z.string(),
        depth: z.string(),
        generatedAt: z.number(),
    }),
});

export type ResearcherOutput = z.infer<typeof ResearcherOutputSchema>;
