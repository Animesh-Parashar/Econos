import { z } from 'zod';

export const WriterInputSchema = z.object({
    topic: z.string().min(3).max(500).describe('Topic to write about'),
    type: z.enum(['article', 'blog', 'email', 'social', 'technical']).default('article'),
    tone: z.enum(['formal', 'casual', 'professional', 'creative']).default('professional'),
    targetLength: z.number().min(100).max(5000).optional().default(500),
    audience: z.string().optional().describe('Target audience'),
    keywords: z.array(z.string()).optional().describe('Keywords to include'),
});

export type WriterInput = z.infer<typeof WriterInputSchema>;

export const WriterOutputSchema = z.object({
    content: z.string().describe('Generated written content'),
    title: z.string().optional(),
    wordCount: z.number(),
    readingTime: z.string(),
    highlights: z.array(z.string()),
    metadata: z.object({ type: z.string(), tone: z.string(), generatedAt: z.number() }),
});

export type WriterOutput = z.infer<typeof WriterOutputSchema>;
