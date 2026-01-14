import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';
import {
    SummaryGenerationInput,
    SummaryGenerationInputSchema,
    SummaryGenerationOutput,
    SummaryGenerationOutputSchema,
} from './schema';
import { countWords, calculateReduction, styleConfigs } from './tools';
import { logger } from '../../utils/logger';

const systemPrompt = fs.readFileSync(
    path.join(__dirname, 'prompt.txt'),
    'utf-8'
);

/**
 * Summary Generation Agent
 */
export class SummaryGenerationAgent {
    private model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>;

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is not set');
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        this.model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    }

    async execute(input: unknown): Promise<SummaryGenerationOutput> {
        const validatedInput = SummaryGenerationInputSchema.parse(input);

        logger.debug('SummaryGenerationAgent executing', { style: validatedInput.style });

        const styleConfig = styleConfigs[validatedInput.style || 'concise'];
        const originalWordCount = countWords(validatedInput.text);

        const userPrompt = `
Please summarize the following text.

Style: ${validatedInput.style || 'concise'}
Maximum Length: ${validatedInput.maxLength} characters
${validatedInput.focusAreas ? `Focus Areas: ${validatedInput.focusAreas.join(', ')}` : ''}

TEXT TO SUMMARIZE:
"""
${validatedInput.text}
"""

Return your response as valid JSON:
{
  "summary": "the summary text",
  "keyPoints": ["point 1", "point 2", ...],
  "topics": ["topic 1", "topic 2", ...],
  "sentiment": "positive|negative|neutral|mixed"
}
`;

        try {
            const result = await this.model.generateContent([
                { text: systemPrompt },
                { text: userPrompt },
            ]);

            const responseText = result.response.text();
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Failed to extract JSON from response');
            }

            const parsedResponse = JSON.parse(jsonMatch[0]);
            const summaryWordCount = countWords(parsedResponse.summary);

            const output: SummaryGenerationOutput = {
                ...parsedResponse,
                wordCount: {
                    original: originalWordCount,
                    summary: summaryWordCount,
                    reduction: calculateReduction(originalWordCount, summaryWordCount),
                },
                metadata: {
                    style: validatedInput.style || 'concise',
                    generatedAt: Math.floor(Date.now() / 1000),
                },
            };

            return SummaryGenerationOutputSchema.parse(output);
        } catch (error) {
            logger.error('SummaryGenerationAgent error', { error });
            throw error;
        }
    }
}

export function createSummaryGenerationAgent(): SummaryGenerationAgent {
    return new SummaryGenerationAgent();
}
