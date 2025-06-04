// filepath: c:\Users\ethan\Projects\chatty\src\app\api\uploads\[...key]\route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Buffer } from 'buffer';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

export const runtime = 'nodejs';
const s3Client = new S3Client({ region: process.env.AWS_REGION! });

export async function GET(request: NextRequest, { params }: { params: { key: string[] } }) {
  console.log(
    '🔍 App Router catch-all GET /api/uploads/[...key]:',
    request.url,
    'params:',
    params.key
  );
  // params.key is an array of path segments; join to reconstruct the original key
  const key = params.key.join('/');
  try {
    const bucket = process.env.AWS_S3_BUCKET!;
    const data = await s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const stream = data.Body as unknown as AsyncIterable<Uint8Array>;
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': data.ContentType || 'application/octet-stream',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('❌ Error fetching attachment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attachment' },
      { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}
