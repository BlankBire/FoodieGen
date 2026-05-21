import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * API Route để phục vụ file media (video, audio) từ thư mục public/
 *
 * Lý do: Next.js Standalone mode KHÔNG tự động serve thư mục public/.
 * Trong dev mode, Next.js dev server serve public/ tự động → video/audio luôn accessible.
 * Trong production (electron build), cần API route này để client truy cập được files.
 *
 * URL mapping:
 *   /api/media/videos/final_xxx.mp4  →  public/videos/final_xxx.mp4
 *   /api/media/audio/fpt_xxx.mp3     →  public/audio/fpt_xxx.mp3
 *
 * QUAN TRỌNG: Phải xử lý HTTP Range Requests đúng cách (trả về 206 Partial Content).
 * Browser dùng range requests để load audio track riêng lẻ trong file MP4/video.
 * Nếu server trả về 200 thay vì 206, Chromium sẽ bỏ qua audio track → không có tiếng.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;

  // Chống path traversal attack (../)
  const safePath = segments.join('/').replace(/\.\./g, '');
  const filePath = path.join(process.cwd(), 'public', safePath);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  try {
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;

    // Xác định Content-Type dựa trên extension
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
      // Xử lý Range Request → trả về 206 Partial Content
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

    // Không có Range header → trả toàn bộ file
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
