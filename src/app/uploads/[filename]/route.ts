import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET(request: Request, { params }: { params: Promise<{ filename: string }> }) {
  const filename = (await params).filename;
  
  // Prevent directory traversal attacks
  if (filename.includes('..') || filename.includes('/')) {
    return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
  }

  const filepath = join(process.cwd(), 'public', 'uploads', filename);

  if (!existsSync(filepath)) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  try {
    const buffer = await readFile(filepath);
    
    // Guess mime type
    const ext = filename.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
    };
    const mimeType = ext && mimeTypes[ext] ? mimeTypes[ext] : 'application/octet-stream';

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      }
    });
  } catch (e) {
    console.error("Error reading file:", e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
