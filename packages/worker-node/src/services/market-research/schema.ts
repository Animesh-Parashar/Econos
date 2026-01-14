import { z } from 'zod';

export const MarketResearchInputSchema = z.object({
    query: z.string().min(3).max(500).describe('Market research query'),
    tokens: z.array(z.string()).optional().describe('Specific tokens to analyze (e.g., BTC, ETH, CRO)'),
    timeframe: z.enum(['1h', '24h', '7d', '30d']).optional().default('24h'),
    analysisType: z.enum(['price', 'trend', 'comparison', 'comprehensive']).optional().default('comprehensive'),
});

export type MarketResearchInput = z.infer<typeof MarketResearchInputSchema>;

export const MarketResearchOutputSchema = z.object({
    analysis: z.string().describe('Market analysis findings'),
    marketData: z.array(z.object({
        token: z.string(),
        symbol: z.string(),
        price: z.string().optional(),
        change24h: z.string().optional(),
        volume24h: z.string().optional(),
        marketCap: z.string().optional(),
    })).optional(),
    insights: z.array(z.object({
        insight: z.string(),
        sentiment: z.enum(['bullish', 'bearish', 'neutral']),
    })),
    recommendations: z.array(z.string()).optional(),
    disclaimer: z.string(),
    metadata: z.object({
        query: z.string(),
        timeframe: z.string(),
        analysisType: z.string(),
        generatedAt: z.number(),
        dataSource: z.string(),
    }),
});

export type MarketResearchOutput = z.infer<typeof MarketResearchOutputSchema>;
