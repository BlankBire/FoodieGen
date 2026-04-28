import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import RunwayML from '@runwayml/sdk';
import jwt from 'jsonwebtoken';

function generateKlingToken(accessKey: string, secretKey: string) {
  const payload = {
    iss: accessKey,
    exp: Math.floor(Date.now() / 1000) + 1800,
    nbf: Math.floor(Date.now() / 1000) - 5
  };
  return jwt.sign(payload, secretKey, { algorithm: 'HS256' });
}

export async function POST(req: Request) {
  try {
    const { provider, key, secret } = await req.json();

    if (!provider) {
      return NextResponse.json({ error: 'Thiếu thông tin provider.' }, { status: 400 });
    }

    if (provider === 'gemini') {
      if (!key) throw new Error('Vui lòng nhập API Key Google Gemini.');
      const ai = new GoogleGenAI({ apiKey: key });
      try {
        await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite-preview',
          contents: [{ role: 'user', parts: [{ text: 'Hi' }] }]
        });
        return NextResponse.json({ success: true, message: 'Google Gemini API Key hợp lệ!' });
      } catch (err: any) {
        const msg = err.message || '';
        // Bắt lỗi quota để vẫn báo là key hợp lệ (vì auth thành công, chỉ là hết quota)
        if (msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')) {
            return NextResponse.json({ success: true, message: 'Google Gemini API Key hợp lệ!' });
        }
        throw new Error('API Key Google Gemini không hợp lệ hoặc đã hết hạn.');
      }
    } 
    
    else if (provider === 'runway') {
      if (!key) throw new Error('Vui lòng nhập API Key RunwayML.');
      const runway = new RunwayML({ apiKey: key });
      try {
        await runway.tasks.retrieve('00000000-0000-4000-8000-000000000000');
        return NextResponse.json({ success: true, message: 'RunwayML API Key hợp lệ!' });
      } catch (err: any) {
        // 404: Valid key, invalid task ID
        // 429: Valid key, out of quota / rate limited
        if (err.status === 404 || err.status === 429 || (err.message && err.message.toLowerCase().includes('credit'))) {
            return NextResponse.json({ success: true, message: 'RunwayML API Key hợp lệ!' });
        }
        throw new Error('API Key RunwayML không hợp lệ hoặc đã hết hạn.');
      }
    } 
    
    else if (provider === 'fpt') {
      if (!key) throw new Error('Vui lòng nhập API Key FPT AI.');
      try {
        const fptRes = await fetch(`https://api.fpt.ai/hmi/tts/v5`, {
          method: 'POST',
          headers: { 
            'api_key': key,
            'voice': 'leminh',
            'speed': '0',
            'format': 'mp3'
          },
          body: 'test'
        });
        const data = await fptRes.json();
        if (data.error === 0 || data.async) {
            return NextResponse.json({ success: true, message: 'FPT AI API Key hợp lệ!' });
        } else {
            // Nếu lỗi báo quota thì auth vẫn thành công
            if (data.message && data.message.toLowerCase().includes('quota')) {
                return NextResponse.json({ success: true, message: 'FPT AI API Key hợp lệ!' });
            }
            throw new Error('API Key FPT AI không hợp lệ hoặc đã hết hạn.');
        }
      } catch (err: any) {
        throw new Error('API Key FPT AI không hợp lệ hoặc đã hết hạn.');
      }
    } 
    
    else if (provider === 'kling') {
      if (!key || !secret) throw new Error('Vui lòng nhập đầy đủ Access Key và Secret Key của Kling AI.');
      try {
        const token = generateKlingToken(key, secret);
        const resp = await fetch('https://api.klingai.com/v1/videos/text2video', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          // Cố tình truyền model sai để Kling báo lỗi "Invalid model" thay vì tạo video thật (tránh trừ tiền oan của user)
          // Nếu Auth sai, Kling sẽ báo lỗi 1002 hoặc 1200 trước khi check model.
          body: JSON.stringify({ model: 'kling-test-dummy-model', prompt: 'test' })
        });
        const data = await resp.json();
        
        // 1002: Access Key not found
        // 1200: Token invalid (sai Secret Key hoặc sai format)
        if (data.code === 1002 || data.code === 1200 || data.code === 401) {
            throw new Error('Access Key/Secret Key Kling AI không hợp lệ hoặc đã hết hạn.');
        } else {
            // Nếu qua được ải Auth, Kling sẽ báo lỗi 1000 (Invalid param) hoặc 1004 (Model not found)
            // Điều này chứng tỏ cặp Key đã hợp lệ 100%
            return NextResponse.json({ success: true, message: `Kling AI Keys hợp lệ!` });
        }
      } catch (err: any) {
        throw new Error(err.message === 'Access Key hoặc Secret Key Kling AI không hợp lệ.' ? err.message : 'Access Key hoặc Secret Key Kling AI không hợp lệ.');
      }
    }

    return NextResponse.json({ error: 'Provider không hợp lệ.' }, { status: 400 });

  } catch (error: any) {
    console.error(`[API-TEST] Error:`, error.message);
    return NextResponse.json({ error: error.message || 'Có lỗi xảy ra khi kiểm tra API Key.' }, { status: 500 });
  }
}
