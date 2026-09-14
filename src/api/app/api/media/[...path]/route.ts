import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  const safePath = segments.join('/').replace(/\.\./g, '');
  const filePath = path.join(process.cwd(), 'public', safePath);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  try {
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;

    const ext = path.extname(filePath).toLowerCase();
    const contentTypeMap: Record<string, string> = {
      '.mp4': 'video/mp4',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.webm': 'video/webm',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
    };
    const contentType = contentTypeMap[ext] || 'application/octet-stream';

    const rangeHeader = req.headers.get('range');

    if (rangeHeader) {
      const match = rangeHeader.match(/bytes=(\d*)-(\d*)/);
      if (!match) {
        return new NextResponse('Invalid Range', { status: 416 });
      }

      const start = match[1] ? parseInt(match[1], 10) : 0;
      const end   = match[2] ? parseInt(match[2], 10) : fileSize - 1;

      if (start > end || start >= fileSize || end >= fileSize) {
        return new NextResponse('Range Not Satisfiable', {
          status: 416,
          headers: { 'Content-Range': `bytes */${fileSize}` },
        });
      }

      const chunkSize = end - start + 1;
      const chunk = Buffer.alloc(chunkSize);
      const fd = fs.openSync(filePath, 'r');
      fs.readSync(fd, chunk, 0, chunkSize, start);
      fs.closeSync(fd);

      return new NextResponse(chunk, {
        status: 206,
        headers: {
          'Content-Type': contentType,
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Content-Length': String(chunkSize),
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'no-cache',
        },
      });
    }

    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(fileSize),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err: any) {
    console.error('[MEDIA-SERVE] Error:', err.message);
    return NextResponse.json({ error: 'Failed to read file' }, { status: 500 });
  }
}
