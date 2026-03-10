'use server';
/**
 * @fileOverview This file defines a Genkit flow for intelligently optimizing images
 * (resizing, cropping, compression) based on specific requirements using AI.
 *
 * - optimizeImage - A function that handles the image optimization process.
 * - ImageOptimizerInput - The input type for the optimizeImage function.
 * - ImageOptimizerOutput - The return type for the optimizeImage function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const ImageOptimizerInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "The input image as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  targetWidth: z.number().describe('The desired output width of the image in pixels.'),
  targetHeight: z.number().describe('The desired output height of the image in pixels.'),
  maxFileSizeKb: z.number().optional().describe('The maximum desired file size in kilobytes.'),
  imageType: z
    .enum(['photo', 'signature'])
    .describe(
      'The type of image being optimized (e.g., photo or signature), which may influence AI decisions.'
    ),
});
export type ImageOptimizerInput = z.infer<typeof ImageOptimizerInputSchema>;

const ImageOptimizerOutputSchema = z.object({
  optimizedImageDataUri: z
    .string()
    .describe(
      "The optimized image as a data URI, including MIME type and Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  analysis: z
    .string()
    .describe('A text description of the optimizations applied to the image.'),
});
export type ImageOptimizerOutput = z.infer<typeof ImageOptimizerOutputSchema>;

export async function optimizeImage(input: ImageOptimizerInput): Promise<ImageOptimizerOutput> {
  return imageOptimizerFlow(input);
}

const imageOptimizerPrompt = ai.definePrompt({
  name: 'imageOptimizerPrompt',
  input: { schema: ImageOptimizerInputSchema },
  output: { schema: ImageOptimizerOutputSchema },
  prompt: `You are an AI-powered image optimization assistant. Your goal is to take an input image,
and optimize it according to the provided requirements. You should resize, crop, and/or compress
the image as needed to meet the target dimensions and file size, while maintaining quality
appropriate for a formal application document.

Input Image Type: {{{imageType}}}
Target Width: {{{targetWidth}}} pixels
Target Height: {{{targetHeight}}} pixels
Max File Size: {{{maxFileSizeKb}}} KB (if specified, try to adhere as closely as possible)

Analyze the input image and perform the necessary optimizations. Provide the optimized image
as a data URI and a concise analysis of the changes made, explaining how the target requirements were met.

Optimized image: {{media url=imageDataUri}}

`,
  config: {
    responseModalities: ['TEXT', 'IMAGE'],
  },
});

const imageOptimizerFlow = ai.defineFlow(
  {
    name: 'imageOptimizerFlow',
    inputSchema: ImageOptimizerInputSchema,
    outputSchema: ImageOptimizerOutputSchema,
  },
  async (input) => {
    const { output, media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-image'),
      prompt: [imageOptimizerPrompt.render(input)],
      config: { ...imageOptimizerPrompt.config },
    });

    if (!media || media.length === 0 || !media[0].url) {
      throw new Error('Image optimization failed: No optimized image returned.');
    }

    return {
      optimizedImageDataUri: media[0].url,
      analysis: output!,
    };
  }
);
