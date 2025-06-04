// filepath: c:\Users\ethan\Projects\chatty\src\app\api\uploads\[key]\route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Buffer } from 'buffer';

export const runtime = 'nodejs';

const s3Client = new S3Client({ region: process.env.AWS_REGION! });

export async function GET(_req: NextRequest, { params }: { params: { key: string } }) {
  const { key } = params;
  try {
    const bucket = process.env.AWS_S3_BUCKET!;
    const data = await s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    // accumulate chunks into a Buffer
    const stream = data.Body as unknown as AsyncIterable<Uint8Array>;
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);
    return new NextResponse(buffer, {
      headers: { 'Content-Type': data.ContentType || 'application/octet-stream' },
    });
  } catch (error) {
    console.error('❌ Error fetching attachment:', error);
    return NextResponse.json({ error: 'Failed to fetch attachment' }, { status: 404 });
  }
}
