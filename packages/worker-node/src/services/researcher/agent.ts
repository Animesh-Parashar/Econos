import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';
import { ResearcherInput, ResearcherInputSchema, ResearcherOutput, ResearcherOutputSchema } from './schema';
import { depthConfigs } from './tools';
import { logger } from '../../utils/logger';

const systemPrompt = fs.readFileSync(path.join(__dirname, 'prompt.txt'), 'utf-8');

export class ResearcherAgent {
    private model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>;

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
        const genAI = new GoogleGenerativeAI(apiKey);
        this.model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    }

    async execute(input: unknown): Promise<ResearcherOutput> {
        const validatedInput = ResearcherInputSchema.parse(input);
        logger.debug('ResearcherAgent executing', { topic: validatedInput.topic });

        const config = depthConfigs[validatedInput.depth || 'standard'];
        const userPrompt = `
Research Topic: "${validatedInput.topic}"
Depth: ${validatedInput.depth || 'standard'}
Format: ${validatedInput.format || 'report'}
${validatedInput.sources ? `Preferred Sources: ${validatedInput.sources.join(', ')}` : ''}

Provide up to ${config.maxInsights} key insights and ${config.maxRelated} related topics.

Return JSON:
{
  "findings": "main research findings",
  "keyInsights": [{"insight": "...", "confidence": "high|medium|low"}],
  "relatedTopics": ["topic1", "topic2"],
  "suggestedQuestions": ["question1", "question2"]
}`;

        try {
            const result = await this.model.generateContent([{ text: systemPrompt }, { text: userPrompt }]);
            const responseText = result.response.text();
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error('Failed to extract JSON');

            const parsed = JSON.parse(jsonMatch[0]);
            return ResearcherOutputSchema.parse({
                ...parsed,
                metadata: { topic: validatedInput.topic, depth: validatedInput.depth || 'standard', generatedAt: Math.floor(Date.now() / 1000) },
            });
        } catch (error) {
            logger.error('ResearcherAgent error', { error });
            throw error;
        }
    }
}

export function createResearcherAgent(): ResearcherAgent {
    return new ResearcherAgent();
}
