import { NextResponse } from 'next/server';
import { Buffer } from 'buffer';
import { uploadFile } from '@/lib/storage';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    // Debug: log incoming form data keys
    const formData = await request.formData();
    console.log('🛠️ Upload API received formData entries:');
    for (const [key, value] of formData.entries()) {
      console.log(`  ${key}:`, value);
    }
    const files = formData.getAll('files');
    console.log('🛠️ Upload API files array length:', files.length);
    const results: Array<{
      key: string;
      url: string;
      filename: string;
      contentType: string;
      size: number;
    }> = [];

    for (const fileEntry of files) {
      console.log('🛠️ Processing fileEntry:', fileEntry);
      if (!(fileEntry instanceof File)) {
        console.warn('⚠️ Skipping non-File entry in uploads API');
        continue;
      }
      const arrayBuffer = await fileEntry.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      // prefix timestamp to avoid naming collisions
      const key = `${Date.now()}-${fileEntry.name}`;
      const url = await uploadFile(buffer, key, fileEntry.type);
      // include metadata
      results.push({
        key,
        url,
        filename: fileEntry.name,
        contentType: fileEntry.type,
        size: fileEntry.size,
      });
    }

    return NextResponse.json({ attachments: results });
  } catch (error) {
    console.error('❌ Error in upload API:', error);
    return NextResponse.json({ error: 'File upload failed' }, { status: 500 });
  }
}
