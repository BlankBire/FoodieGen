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
    const fileBuffer = fs.readFileSync(filePath);
    
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

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(stat.size),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err: any) {
    console.error('[MEDIA-SERVE] Error:', err.message);
    return NextResponse.json({ error: 'Failed to read file' }, { status: 500 });
  }
}
