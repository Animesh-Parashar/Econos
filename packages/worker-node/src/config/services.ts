import { ethers } from 'ethers';

/**
 * Service configuration with pricing in zkTCRO (wei)
 * 1 zkTCRO = 10^18 wei
 */
export interface ServiceConfig {
    id: string;
    name: string;
    description: string;
    price: bigint; // Price in wei
    priceDisplay: string; // Human-readable price
    endpoint: string;
    version: string;
}

/**
 * All available paid AI services
 */
export const services: Record<string, ServiceConfig> = {
    'image-generation': {
        id: 'image-generation',
        name: 'Image Generation',
        description: 'Generate image descriptions and creative prompts with AI',
        price: ethers.parseEther('0.01'), // 0.01 zkTCRO
        priceDisplay: '0.01 zkTCRO',
        endpoint: '/inference/image-generation',
        version: '1.0.0',
    },
    'summary-generation': {
        id: 'summary-generation',
        name: 'Summary Generation',
        description: 'Summarize text content with AI-powered analysis',
        price: ethers.parseEther('0.005'), // 0.005 zkTCRO
        priceDisplay: '0.005 zkTCRO',
        endpoint: '/inference/summary-generation',
        version: '1.0.0',
    },
    'researcher': {
        id: 'researcher',
        name: 'Research Agent',
        description: 'Research topics and gather information using AI',
        price: ethers.parseEther('0.02'), // 0.02 zkTCRO
        priceDisplay: '0.02 zkTCRO',
        endpoint: '/inference/researcher',
        version: '1.0.0',
    },
    'writer': {
        id: 'writer',
        name: 'Writer Agent',
        description: 'Generate written content based on specifications',
        price: ethers.parseEther('0.015'), // 0.015 zkTCRO
        priceDisplay: '0.015 zkTCRO',
        endpoint: '/inference/writer',
        version: '1.0.0',
    },
    'market-research': {
        id: 'market-research',
        name: 'Market Intelligence',
        description: 'Crypto market analysis using Crypto.com market data',
        price: ethers.parseEther('0.025'), // 0.025 zkTCRO
        priceDisplay: '0.025 zkTCRO',
        endpoint: '/inference/market-research',
        version: '1.0.0',
    },
};

/**
 * Get service configuration by name
 */
export function getService(serviceName: string): ServiceConfig | undefined {
    return services[serviceName];
}

/**
 * Get all available service names
 */
export function getServiceNames(): string[] {
    return Object.keys(services);
}

/**
 * Get all services as an array
 */
export function getAllServices(): ServiceConfig[] {
    return Object.values(services);
}
