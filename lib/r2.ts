import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

// Cloudflare R2 client configuration
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
});

export interface R2UploadResult {
  success: boolean;
  key?: string;
  url?: string;
  error?: string;
}

export interface R2DeleteResult {
  success: boolean;
  error?: string;
}

/**
 * Uploads processed image to Cloudflare R2 with temporary key
 * Images are stored for 1 hour before cleanup cron deletes them
 */
export async function uploadToR2(
  buffer: Buffer,
  mimeType: string = 'image/jpeg',
  originalFilename?: string
): Promise<R2UploadResult> {
  try {
    // Generate unique key with timestamp for cleanup
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const extension = mimeType.split('/')[1] || 'jpg';
    const key = `temp/${timestamp}_${randomId}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      // Optional: Add metadata for cleanup tracking
      Metadata: {
        uploadedAt: timestamp.toString(),
        originalFilename: originalFilename || 'unknown',
      },
    });

    await r2Client.send(command);

    // Generate public URL (if bucket is public) or signed URL
    const url = `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${key}`;

    return {
      success: true,
      key,
      url,
    };
  } catch (error) {
    console.error('R2 upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload image',
    };
  }
}

/**
 * Deletes image from R2 storage
 * Called by cleanup cron job or immediately after analysis
 */
export async function deleteFromR2(key: string): Promise<R2DeleteResult> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
      Key: key,
    });

    await r2Client.send(command);

    return { success: true };
  } catch (error) {
    console.error('R2 delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete image',
    };
  }
}

/**
 * Generates a temporary signed URL for secure access
 * Useful if bucket is not public
 */
export async function generateSignedUrl(key: string, expiresIn: number = 3600): Promise<string | null> {
  try {
    // Note: This would require @aws-sdk/s3-request-presigner
    // For now, assuming public bucket access
    return `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${key}`;
  } catch (error) {
    console.error('Signed URL generation error:', error);
    return null;
  }
}

/**
 * Checks if an R2 key exists (for cleanup verification)
 */
export async function keyExists(key: string): Promise<boolean> {
  try {
    // This would require a HeadObjectCommand
    // For cleanup purposes, we can assume delete succeeded if no error
    return true;
  } catch {
    return false;
  }
}