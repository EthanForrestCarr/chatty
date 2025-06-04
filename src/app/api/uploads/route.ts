import { NextResponse } from 'next/server';
import { Buffer } from 'buffer';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { uploadFile } from '@/lib/storage';

export const runtime = 'nodejs';

/**
 * GET /api/uploads?key=<key>
 * Proxy fetch encrypted blob from S3 by key
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const key = url.searchParams.get('key');
  if (!key) {
    return NextResponse.json({ error: 'Missing key parameter' }, { status: 400 });
  }
  try {
    const s3 = new S3Client({ region: process.env.AWS_REGION! });
    const bucket = process.env.AWS_S3_BUCKET!;
    const data = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const stream = data.Body as unknown as AsyncIterable<Uint8Array>;
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);
    return new NextResponse(buffer, {
      headers: { 'Content-Type': data.ContentType || 'application/octet-stream' },
    });
  } catch (error) {
    console.error('❌ Error fetching attachment blob:', error);
    return NextResponse.json({ error: 'Failed to fetch attachment' }, { status: 404 });
  }
}

/**
 * POST /api/uploads
 * Accepts encrypted file blobs and nonces, uploads to S3, and returns attachment metadata.
 */
export async function POST(request: Request) {
  try {
    // Debug: log incoming form data keys
    const formData = await request.formData();
    console.log('🛠️ Upload API received formData entries:');
    for (const [key, value] of formData.entries()) {
      console.log(`  ${key}:`, value);
    }
    const files = formData.getAll('files');
    const nonces = formData.getAll('nonces') as string[];
    console.log('🛠️ Upload API files array length:', files.length);
    const results: Array<{
      key: string;
      url: string;
      filename: string;
      contentType: string;
      size: number;
      nonce?: string;
    }> = [];

    for (let i = 0; i < files.length; i++) {
      console.log('🛠️ Processing fileEntry:', files[i]);
      const fileEntry = files[i];
      const nonce = nonces[i];
      console.log('🛠️ Processing fileEntry:', fileEntry, 'with nonce', nonce);
      if (!(fileEntry instanceof File)) {
        console.warn('⚠️ Skipping non-File entry in uploads API');
        continue;
      }
      const arrayBuffer = await fileEntry.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      // prefix timestamp to avoid naming collisions
      const key = `${Date.now()}-${fileEntry.name}`;
      // upload encrypted blob to S3
      await uploadFile(buffer, key, fileEntry.type);
      // construct URL for client to fetch encrypted blob via query-parameter GET endpoint
      const url = `/api/uploads?key=${encodeURIComponent(key)}`;
      // include metadata
      results.push({
        key,
        url,
        // original S3 URL: s3Url,
        filename: fileEntry.name,
        contentType: fileEntry.type,
        size: fileEntry.size,
        nonce, // include nonce for encrypted attachment
      });
    }

    return NextResponse.json({ attachments: results });
  } catch (error) {
    console.error('❌ Error in upload API:', error);
    return NextResponse.json({ error: 'File upload failed' }, { status: 500 });
  }
}
