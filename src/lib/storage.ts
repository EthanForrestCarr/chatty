import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize the S3 client using environment variables
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
});

/**
 * Uploads a buffer or stream to S3 under the specified key and returns a presigned URL for access.
 * @param buffer - File data as a Buffer
 * @param key - Object key (path/filename) in the bucket
 * @param contentType - MIME type of the file
 * @returns A presigned URL for downloading the uploaded object
 */
export async function uploadFile(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  try {
    const bucket = process.env.AWS_S3_BUCKET!;

    // Upload the object to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );

    // Generate a presigned URL valid for 1 hour
    const url = await getSignedUrl(s3Client, new GetObjectCommand({ Bucket: bucket, Key: key }), {
      expiresIn: 3600,
    });

    return url;
  } catch (error) {
    console.error('❌ S3 uploadFile error:', error);
    throw error;
  }
}

/**
 * Deletes an object from the S3 bucket.
 * @param key - Object key (path/filename) to delete
 */
export async function deleteFile(key: string): Promise<void> {
  try {
    const bucket = process.env.AWS_S3_BUCKET!;
    await s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  } catch (error) {
    console.error('❌ S3 deleteFile error:', error);
    throw error;
  }
}
