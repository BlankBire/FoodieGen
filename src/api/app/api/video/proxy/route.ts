import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const u = req.nextUrl.searchParams.get('u');
    if (!u) {
      return NextResponse.json({ error: 'Missing u parameter' }, { status: 400 });
    }

    let targetUrl: string;
    try {
      targetUrl = Buffer.from(u, 'base64url').toString('utf-8');
    } catch {
      return NextResponse.json({ error: 'Invalid u parameter' }, { status: 400 });
    }

    // Only allow Google Generative Language API file downloads
    if (
      !targetUrl.startsWith('https://generativelanguage.googleapis.com/') ||
      !targetUrl.includes('/download/')
    ) {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GOOGLE_API_KEY not configured' }, { status: 500 });
    }

    const res = await fetch(targetUrl, {
      headers: { 'x-goog-api-key': apiKey },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('[Video Proxy] Upstream error:', res.status, text);
      return NextResponse.json(
        { error: `Upstream error: ${res.status}` },
        { status: res.status }
      );
    }

    const contentType = res.headers.get('content-type') || 'video/mp4';
    const body = res.body;
    if (!body) {
      return NextResponse.json({ error: 'Empty response' }, { status: 502 });
    }

    return new NextResponse(body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    console.error('[Video Proxy] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
