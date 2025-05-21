import { NextResponse } from 'next/server';
import { Buffer } from 'buffer';
import { uploadFile } from '@/lib/storage';

export const runtime = 'node';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files');
    const results: Array<{ key: string; url: string }> = [];

    for (const fileEntry of files) {
      if (!(fileEntry instanceof File)) continue;
      const arrayBuffer = await fileEntry.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      // prefix timestamp to avoid naming collisions
      const key = `${Date.now()}-${fileEntry.name}`;
      const url = await uploadFile(buffer, key, fileEntry.type);
      results.push({ key, url });
    }

    return NextResponse.json({ attachments: results });
  } catch (error) {
    console.error('❌ Error in upload API:', error);
    return NextResponse.json({ error: 'File upload failed' }, { status: 500 });
  }
}
