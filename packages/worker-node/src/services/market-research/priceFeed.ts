/**
 * Price Feed Integration for Market Research Service
 * Fetches real market data from Crypto.com Exchange API
 */

import { logger } from '../../utils/logger';

export interface TokenPrice {
    token: string;
    symbol: string;
    price?: string;
    change24h?: string;
    volume24h?: string;
    marketCap?: string;
}

interface CryptoComTickerResponse {
    code: number;
    result?: {
        data: Array<{
            i: string; // instrument name (e.g., "BTC_USDT")
            h: string; // highest trade price in 24h
            l: string; // lowest trade price in 24h
            a: string; // last trade price
            v: string; // total 24h traded volume
            vv: string; // total 24h traded volume value (in quote currency)
            c: string; // 24h price change
            b: string; // best bid price
            k: string; // best ask price
            t: number; // timestamp
        }>;
    };
}

// Map of token symbols to Crypto.com trading pairs
const tokenToPair: Record<string, string> = {
    BTC: 'BTC_USDT',
    ETH: 'ETH_USDT',
    CRO: 'CRO_USDT',
    SOL: 'SOL_USDT',
    BNB: 'BNB_USDT',
    USDT: 'USDT_USD',
    USDC: 'USDC_USD',
    XRP: 'XRP_USDT',
    ADA: 'ADA_USDT',
    DOGE: 'DOGE_USDT',
    MATIC: 'MATIC_USDT',
    DOT: 'DOT_USDT',
    AVAX: 'AVAX_USDT',
    LINK: 'LINK_USDT',
    UNI: 'UNI_USDT',
};

/**
 * Fetch market data for given tokens from Crypto.com Exchange API
 */
export async function fetchMarketData(tokens: string[]): Promise<TokenPrice[]> {
    try {
        // Fetch all tickers from Crypto.com
        const response = await fetch('https://api.crypto.com/exchange/v1/public/get-tickers');

        if (!response.ok) {
            logger.warn(`Crypto.com API returned ${response.status}`);
            return fallbackResponse(tokens, 'API unavailable');
        }

        const data = await response.json() as CryptoComTickerResponse;

        if (data.code !== 0 || !data.result?.data) {
            logger.warn('Crypto.com API returned error or no data');
            return fallbackResponse(tokens, 'No data available');
        }

        // Create a map of instrument -> ticker data
        const tickerMap = new Map(
            data.result.data.map(ticker => [ticker.i, ticker])
        );

        // Map requested tokens to their market data
        return tokens.map(token => {
            const upperToken = token.toUpperCase();
            const pair = tokenToPair[upperToken] || `${upperToken}_USDT`;
            const ticker = tickerMap.get(pair);

            if (!ticker) {
                return {
                    token: upperToken,
                    symbol: upperToken,
                    price: 'Not available on Crypto.com',
                    change24h: 'N/A',
                    volume24h: 'N/A',
                    marketCap: 'N/A',
                };
            }

            // Calculate percentage change
            const priceChange = parseFloat(ticker.c);
            const changePercent = priceChange >= 0 ? `+${priceChange.toFixed(2)}%` : `${priceChange.toFixed(2)}%`;

            return {
                token: upperToken,
                symbol: upperToken,
                price: `$${parseFloat(ticker.a).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}`,
                change24h: changePercent,
                volume24h: `$${parseFloat(ticker.vv).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                marketCap: 'Query CoinGecko for market cap', // Crypto.com doesn't provide market cap
            };
        });
    } catch (error) {
        logger.error('Error fetching market data from Crypto.com', { error });
        return fallbackResponse(tokens, 'Fetch error');
    }
}

/**
 * Fallback response when API is unavailable
 */
function fallbackResponse(tokens: string[], reason: string): TokenPrice[] {
    return tokens.map(token => ({
        token: token.toUpperCase(),
        symbol: token.toUpperCase(),
        price: reason,
        change24h: 'N/A',
        volume24h: 'N/A',
        marketCap: 'N/A',
    }));
}

/**
 * Common cryptocurrency tokens with their metadata
 */
export const popularTokens: Record<string, { name: string; category: string }> = {
    BTC: { name: 'Bitcoin', category: 'Store of Value' },
    ETH: { name: 'Ethereum', category: 'Smart Contract Platform' },
    CRO: { name: 'Cronos', category: 'Exchange Token' },
    USDT: { name: 'Tether', category: 'Stablecoin' },
    USDC: { name: 'USD Coin', category: 'Stablecoin' },
    SOL: { name: 'Solana', category: 'Smart Contract Platform' },
    BNB: { name: 'BNB', category: 'Exchange Token' },
};

/**
 * Risk disclaimer text
 */
export const RISK_DISCLAIMER =
    'This analysis is for informational purposes only and should not be considered financial advice. ' +
    'Cryptocurrency investments are highly volatile and risky. Always conduct your own research (DYOR) ' +
    'and consult with a qualified financial advisor before making investment decisions.';
