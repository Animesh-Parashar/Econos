/**
 * Tools available to the image generation agent
 * Currently a placeholder - can be extended with actual image generation APIs
 */

export interface ImageTool {
    name: string;
    description: string;
    execute: (params: Record<string, unknown>) => Promise<unknown>;
}

/**
 * Available tools for image generation service
 * These are optional extensions - the core service uses Gemini for prompt enhancement
 */
export const imageGenerationTools: ImageTool[] = [
    // Placeholder for future tool integrations
    // Example: DALL-E integration, Stable Diffusion API, etc.
];

/**
 * Style presets for different image types
 */
export const stylePresets = {
    realistic: {
        keywords: ['photorealistic', 'highly detailed', '8k uhd', 'natural lighting'],
        negativeKeywords: ['cartoon', 'anime', 'illustration', 'drawing'],
    },
    artistic: {
        keywords: ['artistic', 'painterly', 'expressive', 'creative'],
        negativeKeywords: ['photorealistic', 'photograph', 'stock photo'],
    },
    abstract: {
        keywords: ['abstract', 'geometric', 'non-representational', 'patterns'],
        negativeKeywords: ['realistic', 'detailed face', 'specific objects'],
    },
    cartoon: {
        keywords: ['cartoon style', 'animated', 'vibrant colors', 'clean lines'],
        negativeKeywords: ['photorealistic', 'uncanny', 'hyper-detailed'],
    },
    professional: {
        keywords: ['professional', 'corporate', 'clean', 'modern', 'minimalist'],
        negativeKeywords: ['cluttered', 'chaotic', 'unprofessional'],
    },
};

/**
 * Color palettes for style guide generation
 */
export const colorPalettes = {
    warm: ['#FF6B6B', '#FFA07A', '#FFD93D', '#C9B037'],
    cool: ['#4ECDC4', '#45B7D1', '#6C5CE7', '#A8E6CF'],
    neutral: ['#2D3436', '#636E72', '#B2BEC3', '#DFE6E9'],
    vibrant: ['#E91E63', '#9C27B0', '#00BCD4', '#FFEB3B'],
    pastel: ['#FFB3BA', '#BAFFC9', '#BAE1FF', '#FFFFBA'],
};
