import { GoogleGenAI } from '@google/genai';
import {
    ImageGenerationInput,
    ImageGenerationInputSchema,
    ImageGenerationOutput,
    ImageGenerationOutputSchema,
} from './schema';
import { logger } from '../../utils/logger';

/**
 * Image Generation Agent using Gemini 2.5 Flash Image
 * 
 * Generates actual images using Google's native image generation model
 * This uses the free tier of Gemini API!
 */
export class ImageGenerationAgent {
    private ai: GoogleGenAI;
    private model = 'gemini-2.5-flash-image'; // Gemini 2.5 Flash with image generation

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is not set');
        }

        this.ai = new GoogleGenAI({ apiKey });
    }

    /**
     * Generate images based on the input prompt
     */
    async execute(input: unknown): Promise<ImageGenerationOutput> {
        const validatedInput = ImageGenerationInputSchema.parse(input);

        logger.debug('ImageGenerationAgent executing', {
            prompt: validatedInput.prompt.slice(0, 50) + '...',
            numberOfImages: validatedInput.numberOfImages,
        });

        // Build the full prompt with style guidance
        let fullPrompt = `Generate an image: ${validatedInput.prompt}`;

        if (validatedInput.style) {
            const styleGuide: Record<string, string> = {
                photo: 'photorealistic, high quality photograph',
                art: 'artistic, painting style, fine art',
                digital_art: 'digital art, modern illustration',
                sketch: 'pencil sketch, hand-drawn style',
            };
            fullPrompt = `${styleGuide[validatedInput.style]}: ${fullPrompt}`;
        }

        if (validatedInput.negativePrompt) {
            fullPrompt += `. Avoid: ${validatedInput.negativePrompt}`;
        }

        try {
            const response = await this.ai.models.generateContent({
                model: this.model,
                contents: fullPrompt,
                config: {
                    responseModalities: ['image', 'text'],
                },
            });

            // Extract images from response
            const images: Array<{ imageBase64: string; mimeType: string }> = [];

            const candidate = response.candidates?.[0];
            if (candidate?.content?.parts) {
                for (const part of candidate.content.parts) {
                    if (part.inlineData?.data) {
                        images.push({
                            imageBase64: part.inlineData.data,
                            mimeType: part.inlineData.mimeType || 'image/png',
                        });
                    }
                }
            }

            if (images.length === 0) {
                throw new Error('No images were generated. The model may have returned text only.');
            }

            const output: ImageGenerationOutput = {
                images,
                prompt: fullPrompt,
                numberOfImages: images.length,
                metadata: {
                    model: this.model,
                    aspectRatio: validatedInput.aspectRatio || '1:1',
                    generatedAt: Math.floor(Date.now() / 1000),
                },
            };

            logger.info('ImageGenerationAgent completed', {
                imagesGenerated: images.length,
            });

            return ImageGenerationOutputSchema.parse(output);
        } catch (error) {
            logger.error('ImageGenerationAgent error', { error });
            throw error;
        }
    }
}

/**
 * Factory function to create an ImageGenerationAgent instance
 */
export function createImageGenerationAgent(): ImageGenerationAgent {
    return new ImageGenerationAgent();
}
