import sharp from 'sharp';
import { promises as fs } from 'fs';

export interface ImageValidationResult {
  isValid: boolean;
  error?: string;
  metadata?: {
    width: number;
    height: number;
    format: string;
    size: number;
  };
}

export interface ProcessedImage {
  buffer: Buffer;
  metadata: {
    width: number;
    height: number;
    format: string;
    size: number;
  };
}

/**
 * Validates image file according to Uzoza requirements
 * - Max 10MB file size
 * - Min 200px, max 4096px dimensions
 * - Supported formats: JPEG, PNG, WEBP
 */
export async function validateImage(file: File): Promise<ImageValidationResult> {
  try {
    // Check file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return { isValid: false, error: 'Image file too large. Maximum size is 10MB.' };
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return { isValid: false, error: 'Invalid file type. Only JPEG, PNG, and WEBP are supported.' };
    }

    // Convert File to Buffer for Sharp processing
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Get image metadata
    const metadata = await sharp(buffer).metadata();

    if (!metadata.width || !metadata.height) {
      return { isValid: false, error: 'Unable to read image dimensions.' };
    }

    // Check dimensions (min 200px, max 4096px)
    const { width, height } = metadata;
    const minDimension = 200;
    const maxDimension = 4096;

    if (width < minDimension || height < minDimension) {
      return {
        isValid: false,
        error: `Image dimensions too small. Minimum size is ${minDimension}x${minDimension} pixels.`
      };
    }

    if (width > maxDimension || height > maxDimension) {
      return {
        isValid: false,
        error: `Image dimensions too large. Maximum size is ${maxDimension}x${maxDimension} pixels.`
      };
    }

    return {
      isValid: true,
      metadata: {
        width,
        height,
        format: metadata.format || 'unknown',
        size: buffer.length
      }
    };
  } catch (error) {
    console.error('Image validation error:', error);
    return { isValid: false, error: 'Failed to process image. Please try a different file.' };
  }
}

/**
 * Processes and optimizes image for AI analysis
 * - Resize to max 1024px (maintain aspect ratio)
 * - Convert to JPEG with 85% quality
 * - Strip metadata for privacy
 */
export async function processImageForAnalysis(file: File): Promise<ProcessedImage> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Process with Sharp
  const processedBuffer = await sharp(buffer)
    .resize(1024, 1024, {
      fit: 'inside', // Maintain aspect ratio
      withoutEnlargement: true // Don't upscale small images
    })
    .jpeg({
      quality: 85,
      mozjpeg: true // Better compression
    })
    .toBuffer();

  // Get final metadata
  const metadata = await sharp(processedBuffer).metadata();

  return {
    buffer: processedBuffer,
    metadata: {
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: 'jpeg',
      size: processedBuffer.length
    }
  };
}

/**
 * Converts processed image buffer to base64 for Grok API
 */
export function imageToBase64(buffer: Buffer, mimeType: string = 'image/jpeg'): string {
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}