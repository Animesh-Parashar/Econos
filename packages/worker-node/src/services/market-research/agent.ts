import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';
import { MarketResearchInput, MarketResearchInputSchema, MarketResearchOutput, MarketResearchOutputSchema } from './schema';
import { fetchMarketData, RISK_DISCLAIMER, popularTokens } from './priceFeed';
import { analysisConfigs, timeframeLabels } from './tools';
import { logger } from '../../utils/logger';

const systemPrompt = fs.readFileSync(path.join(__dirname, 'prompt.txt'), 'utf-8');

/**
 * Market Research Agent
 * 
 * Uses Google Gemini + Crypto.com market data for crypto analysis
 */
export class MarketResearchAgent {
    private model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>;

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
        const genAI = new GoogleGenerativeAI(apiKey);
        this.model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    }

    async execute(input: unknown): Promise<MarketResearchOutput> {
        const validatedInput = MarketResearchInputSchema.parse(input);
        logger.debug('MarketResearchAgent executing', { query: validatedInput.query });

        const config = analysisConfigs[validatedInput.analysisType || 'comprehensive'];
        const timeframe = timeframeLabels[validatedInput.timeframe || '24h'];

        // Fetch market data for specified tokens
        const tokens = validatedInput.tokens || ['BTC', 'ETH', 'CRO'];
        const marketData = await fetchMarketData(tokens);

        // Build context with token info
        const tokenContext = tokens.map(t => {
            const info = popularTokens[t.toUpperCase()];
            return info ? `${t.toUpperCase()} (${info.name} - ${info.category})` : t;
        }).join(', ');

        const userPrompt = `
Market Research Query: "${validatedInput.query}"
Timeframe: ${timeframe}
Analysis Type: ${validatedInput.analysisType || 'comprehensive'}
Tokens of Interest: ${tokenContext}
Focus Areas: ${config.focusAreas.join(', ')}

Market Data Context:
${JSON.stringify(marketData, null, 2)}

Provide a comprehensive market analysis. Return JSON:
{
  "analysis": "detailed analysis text",
  "insights": [{"insight": "...", "sentiment": "bullish|bearish|neutral"}],
  "recommendations": ["recommendation 1", "..."]
}`;

        try {
            const result = await this.model.generateContent([{ text: systemPrompt }, { text: userPrompt }]);
            const responseText = result.response.text();
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error('Failed to extract JSON');

            const parsed = JSON.parse(jsonMatch[0]);

            return MarketResearchOutputSchema.parse({
                ...parsed,
                marketData,
                disclaimer: RISK_DISCLAIMER,
                metadata: {
                    query: validatedInput.query,
                    timeframe: validatedInput.timeframe || '24h',
                    analysisType: validatedInput.analysisType || 'comprehensive',
                    generatedAt: Math.floor(Date.now() / 1000),
                    dataSource: 'Crypto.com AI Agent SDK + Gemini',
                },
            });
        } catch (error) {
            logger.error('MarketResearchAgent error', { error });
            throw error;
        }
    }
}

export function createMarketResearchAgent(): MarketResearchAgent {
    return new MarketResearchAgent();
}
