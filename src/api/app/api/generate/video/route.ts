import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import RunwayML, { toFile } from '@runwayml/sdk';
import { GoogleGenAI } from '@google/genai';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { CHARACTERS } from '../../../../lib/constants';

async function resizeImageForRunway(base64DataUri: string, ratio: string = '720:1280'): Promise<string> {
  const match = base64DataUri.match(/^data:[^;]+;base64,(.+)$/);
  if (!match) return base64DataUri;
  let buffer: Buffer = Buffer.from(match[1], 'base64');

  // Normalize exotic formats (HEIC, WebP, TIFF) → JPEG before processing
  try {
    const meta = await sharp(buffer).metadata();
    if (meta.format && !['jpeg', 'png', 'gif'].includes(meta.format)) {
      buffer = Buffer.from(await sharp(buffer).jpeg({ quality: 90 }).toBuffer());
    }
  } catch { /* keep original buffer if metadata fails */ }

  const [tw, th] = ratio.split(':').map(Number);
  const targetW = tw <= 1280 ? tw : 1280;
  const targetH = th <= 1280 ? th : 1280;

  // Scale image so its width fills targetW, preserving aspect ratio (no crop horizontally)
  const meta = await sharp(buffer).metadata();
  const origW = meta.width || targetW;
  const origH = meta.height || targetH;
  const scaledH = Math.round(origH * targetW / origW);

  if (scaledH >= targetH) {
    // Image is already taller than target after scaling → center crop vertically (no side padding needed)
    const cropTop = Math.floor((scaledH - targetH) / 2);
    const result = await sharp(buffer)
      .resize(targetW, scaledH)
      .extract({ left: 0, top: cropTop, width: targetW, height: targetH })
      .jpeg({ quality: 88 })
      .toBuffer();
    return `data:image/jpeg;base64,${result.toString('base64')}`;
  }

  // Image is shorter than target (e.g. square source in portrait frame) → mirror-fill top & bottom.
  // Mirror-fill: Sharp reflects the image edges into the padding zones, producing sharp, natural-looking
  // content that Runway reads as one continuous scene — no blur confusion, no empty zones.
  const padTotal = targetH - scaledH;
  const padTop = Math.floor(padTotal / 2);
  const padBottom = padTotal - padTop;

  const scaledBuffer = await sharp(buffer)
    .resize(targetW, scaledH)
    .toBuffer();

  const result = await sharp(scaledBuffer)
    .extend({ top: padTop, bottom: padBottom, left: 0, right: 0, extendWith: 'mirror' })
    .jpeg({ quality: 88 })
    .toBuffer();

  return `data:image/jpeg;base64,${result.toString('base64')}`;
}

function emotionToVisual(emotion: string): string {
  const map: Record<string, string> = {
    'Vui tươi': 'Bright warm lighting, vivid saturated colors, upbeat fast cuts, smiling expressions.',
    'Sang trọng': 'Dark rich tones, dramatic side lighting, slow elegant camera moves, premium textures.',
    'Ấm cúng': 'Golden hour warm tones, soft diffused light, gentle slow motion, cozy intimate framing.',
    'Phấn khích': 'High energy motion, dynamic handheld camera, bold colors, fast-paced energetic cuts.',
    'Bình yên': 'Soft pastel palette, gentle bokeh, slow drift camera, serene natural light.',
    'Mãnh liệt': 'Contrast-heavy lighting, deep shadows, intense close-ups, dramatic rimlight.',
    'Bí ẩn': 'Low-key lighting, cool dark tones, shallow depth of field, mysterious atmosphere.',
    'Tươi mới': 'Clean bright whites, natural daylight, crisp sharp focus, airy open framing.',
  };
  return map[emotion] || `Evoke a sense of ${emotion} through lighting, color grading, and pacing.`;
}

function toneToVisual(tone: string): string {
  const map: Record<string, string> = {
    'Kích thích': 'Fast dynamic transitions, bold on-screen energy, urgent pacing.',
    'Sang trọng': 'Slow deliberate pacing, minimal motion, refined elegant composition.',
    'Cảm xúc': 'Soft focus emotional close-ups, lingering shots, gentle movement.',
    'Bán hàng': 'Product prominently centered, clear bright presentation, confident direct framing.',
    'Viral': 'Unexpected angle, eye-catching moment in first 2 seconds, punchy quick cuts.',
    'Review': 'Steady medium shots, natural authentic lighting, documentary-style framing.',
    'Giáo dục': 'Clear well-lit step-by-step framing, close-up detail shots, organized composition.',
    'Kể chuyện': 'Cinematic wide establishing shots, smooth narrative transitions, atmospheric depth.',
    'Hài hước': 'Playful unconventional angles, exaggerated reactions, bouncy light movement.',
  };
  return map[tone] || `Visual presentation should reflect a ${tone} tone throughout.`;
}

/**
 * Sử dụng Gemini (@google/genai) để "thông não" kịch bản thô.
 * Chuyển sang v1 để tránh lỗi 404 v1beta.
 */
async function refineManualScript(rawText: string, apiKey: string, targetDuration: string = '10s', emotion?: string, style?: string, tone?: string) {
  // --- TỐI ƯU HÓA: Bỏ qua Gemini nếu rawText đã là JSON hợp lệ ---
  try {
    const parsed = JSON.parse(rawText);
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].sceneOrder) {
      console.log('[GEMINI-SKIP] Kịch bản đã là JSON chuẩn, bỏ qua bước hiệu chỉnh để tiết kiệm Quota.');
      return parsed;
    }
  } catch (e) {
    // Không phải JSON, tiếp tục gọi Gemini
  }

  const ai = new GoogleGenAI({ apiKey }); 
  const modelId = 'gemini-3.1-flash-lite-preview'; 
  
  // Tính toán số từ cần thiết để đọc vừa với thời lượng (tốc độ đọc trung bình ~3.2 từ/giây)
  let durationSeconds = 10;
  if (targetDuration.startsWith('custom:')) {
    durationSeconds = parseInt(targetDuration.split(':')[1]) || 10;
  } else if (targetDuration.endsWith('s')) {
    durationSeconds = parseInt(targetDuration.replace('s', '')) || 10;
  } else if (targetDuration.endsWith('m')) {
    durationSeconds = (parseInt(targetDuration.replace('m', '')) || 1) * 60;
  }
  const targetWordCount = Math.floor(durationSeconds * 3.2);
  const minWordCount = Math.floor(targetWordCount * 0.85);

  const prompt = `Bạn là chuyên gia hiệu đính kịch bản điện ảnh. 
Hãy trau chuốt kịch bản đồ ăn sau thành phiên bản Cinematic chuyên nghiệp nhưng vẫn tự nhiên: "${rawText}".

YÊU CẦU:
1. Video này có thời lượng mục tiêu là ${durationSeconds} giây. Để khớp chính xác với tốc độ đọc của AI Voice, tổng số từ tiếng Việt của tất cả lời thoại (audioScript) PHẢI nằm trong khoảng từ ${minWordCount} đến ${targetWordCount} từ. KHÔNG viết quá ngắn (tránh video bị im lặng ở đoạn cuối) và KHÔNG viết quá dài (tránh bị cắt tiếng). Phân tách nội dung thành số cảnh hợp lý.
2. visualDescription: Miêu tả cốt truyện một cách mượt mà, gợi hình bằng TIẾNG VIỆT tự nhiên. TUYỆT ĐỐI KHÔNG chứa thuật ngữ tiếng Anh hay chỉ thị camera.
3. technicalKeywords: Chứa toàn bộ thuật ngữ kỹ thuật tiếng Anh (Vd: macro, panning, rim light, shallow depth of field, lip-sync, active mouth movement, strict physical realism, gravity-aware, rigid object consistency, high adherence).
4. Lời thoại (audioScript) phải tự nhiên, cô đọng. ĐẶC BIỆT: Phải giữ nguyên và lồng ghép TÊN THƯƠNG HIỆU một cách trang trọng nếu kịch bản gốc có nhắc tới.
5. Trả về duy nhất dữ liệu dưới dạng JSON array: [{"sceneOrder":1, "title":"", "visualDescription":"", "audioScript":"", "technicalKeywords":""}].
${emotion ? `6. CẢM XÚC CHỦ ĐẠO: ${emotion}. Lời thoại và hình ảnh phải toát lên cảm xúc "${emotion}".` : ''}
${style ? `7. PHONG CÁCH HÌNH ẢNH: ${style}. Mô tả hình ảnh phải mang phong cách "${style}".` : ''}
${tone ? `8. TONE NỘI DUNG: ${tone}. Giọng điệu kịch bản phải chuẩn chất "${tone}".` : ''}`;

  let result;
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      result = await ai.models.generateContent({
        model: modelId,
        contents: [{ parts: [{ text: prompt }] }],
      });
      break; 
    } catch (e: any) {
      attempts++;
      const errStr = JSON.stringify(e);
      const is503 = e.status === 503 || errStr.includes('503');
      const is500 = e.status === 500 || errStr.includes('"code":500') || errStr.includes('INTERNAL');
      const is429 = e.status === 429 || errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED');

      if ((is503 || is500) && attempts < maxAttempts) {
        console.log(`[GEMINI-RETRY-VIDEO] ${is500 ? '500 Internal' : '503 High Demand'}. Attempt ${attempts}...`);
        await new Promise(r => setTimeout(r, 3000));
        continue;
      }

      if (is429 && attempts < maxAttempts) {
        console.warn(`[GEMINI-RATE-LIMIT] 429 Quota Exceeded. Waiting 60s before retry...`);
        await new Promise(r => setTimeout(r, 60000)); 
        continue;
      }
      
      // Prefix error with API source for frontend identification
      const errMsg = e.message || 'Unknown Gemini error';
      const prefixed = new Error(`[Gemini] ${errMsg}`);
      (prefixed as any).apiSource = 'gemini';
      throw prefixed;
    }
  }
  
  const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const cleanJson = text.replace(/```json|```/g, '').trim();
  
  try {
    return JSON.parse(cleanJson);
  } catch (e: any) {
    const match = cleanJson.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);
    const parseErr = new Error('[Gemini] Không thể parse kịch bản hiệu chỉnh từ Gemini.');
    (parseErr as any).apiSource = 'gemini';
    throw parseErr;
  }
}

async function generateAudioTask(
  totalAudioScript: string,
  config: any,
  finalScriptId: string,
  audioDir: string,
  audioFilePath: string,
  fptApiKeyInput?: string
) {
  if (!totalAudioScript.trim()) {
    console.warn('[FPT-AI] [SKIP] totalAudioScript is empty, skipping TTS.');
    return '';
  }

  const fptVoice = config?.voiceGender || 'leminh';
  const fptApiKey = fptApiKeyInput || process.env.FPT_AI_API_KEY;
  const fptSpeed = Math.floor(((config?.voiceSpeed ?? 50) / 100) * 6) - 3;
  const MAX_API_RETRIES = 3;
  
  console.log(`[FPT-AI] [TASK] Voice: ${fptVoice} | Speed: ${fptSpeed} | Text length: ${totalAudioScript.trim().length} chars`);

  for (let attempt = 1; attempt <= MAX_API_RETRIES; attempt++) {
    try {
      console.log(`[FPT-AI] [ATTEMPT ${attempt}/${MAX_API_RETRIES}] Calling FPT TTS API...`);
      
      const fptRes = await fetch(`https://api.fpt.ai/hmi/tts/v5`, {
        method: 'POST',
        headers: { 
          'api_key': fptApiKey || '',
          'voice': fptVoice,
          'speed': String(fptSpeed),
          'format': 'mp3'
        },
        body: totalAudioScript.trim()
      });
      
      const fptData = await fptRes.json();
      console.log(`[FPT-AI] [RESPONSE] Status: ${fptRes.status} | Data:`, JSON.stringify(fptData).substring(0, 500));
      
      if (!fptData.async || fptData.error !== 0) {
        console.error(`[FPT-AI] [API-REJECTED] error: ${fptData.error} | message: ${fptData.message || 'N/A'}`);
        continue; // Retry with new API call
      }

      const asyncUrl = fptData.async;
      console.log(`[FPT-AI] [POLLING] Async URL: ${asyncUrl}`);
      let audioBuffer: Buffer | null = null;
      
      // Đợi lâu hơn trước poll đầu tiên để FPT có thời gian xử lý
      await new Promise(r => setTimeout(r, 6000));

      const maxPolls = 30; // 30 polls × 3s = 90s
      for (let i = 0; i < maxPolls; i++) {
        try {
          const checkRes = await fetch(asyncUrl);
          const contentType = checkRes.headers.get('content-type') || '';
          
          if (i % 4 === 0) {
            console.log(`[FPT-AI] [POLL #${i+1}] Status: ${checkRes.status} | Content-Type: ${contentType}`);
          }
          
          if (checkRes.ok && contentType.includes('audio')) {
            audioBuffer = Buffer.from(await checkRes.arrayBuffer());
            console.log(`[FPT-AI] [SUCCESS] Audio received: ${audioBuffer.length} bytes after ~${3 + (i+1)*3}s`);
            break;
          }
        } catch (pollErr: any) {
          console.warn(`[FPT-AI] [POLL #${i+1} ERROR]`, pollErr.message);
        }
        await new Promise(r => setTimeout(r, 3000));
      }
      
      if (!audioBuffer) {
        console.warn(`[FPT-AI] [POLL-TIMEOUT] Attempt ${attempt}: Async URL never resolved. ${attempt < MAX_API_RETRIES ? 'Retrying with new API call...' : 'Giving up.'}`);
        // Đợi 2s trước khi retry API call mới
        if (attempt < MAX_API_RETRIES) await new Promise(r => setTimeout(r, 2000));
        continue; // Retry toàn bộ FPT API call
      }
      
      // === THÀNH CÔNG - Lưu file ===
      const rawAudioPath = path.join(audioDir, `raw_fpt_${finalScriptId}.mp3`);
      fs.writeFileSync(rawAudioPath, audioBuffer);
      console.log(`[FPT-AI] [SAVED] Raw audio: ${rawAudioPath}`);
      
      try {
        const { execSync } = require('child_process');
        const ffmpegPath = path.join(process.cwd(), 'bin', 'ffmpeg.exe');
        execSync(`"${ffmpegPath}" -y -i "${rawAudioPath}" -f lavfi -t 1 -i anullsrc=r=44100:cl=stereo -filter_complex "[0:a]aresample=44100[a0];[1:a]aresample=44100[a1];[a0][a1]concat=n=2:v=0:a=1" "${audioFilePath}"`);
        if (fs.existsSync(rawAudioPath)) fs.unlinkSync(rawAudioPath);
        console.log(`[FPT-AI] [COMPLETE] Padded audio saved: ${audioFilePath}`);
        return `/api/media/audio/fpt_${finalScriptId}.mp3`;
      } catch (padErr) {
        console.error(`[FPT-AI-PAD-ERROR]`, padErr);
        fs.writeFileSync(audioFilePath, audioBuffer);
        return `/api/media/audio/fpt_${finalScriptId}.mp3`;
      }

    } catch (err: any) {
      console.error(`[FPT-AI] [ATTEMPT ${attempt} CRITICAL]`, err.message);
      if (attempt < MAX_API_RETRIES) await new Promise(r => setTimeout(r, 2000));
      if (attempt === MAX_API_RETRIES) {
        const fptErr = new Error(`[FPT.ai TTS] ${err.message || 'Audio generation failed'}`);
        (fptErr as any).apiSource = 'fpt';
        throw fptErr;
      }
    }
  }
  
  console.error(`[FPT-AI] [FAILED] All ${MAX_API_RETRIES} attempts exhausted. No audio generated.`);
  return '';
}

async function generateVideoTask(
  runway: RunwayML,
  visualPrompt: string,
  ratio: string,
  duration: number,
  promptImage?: string,
  preferredModel?: string
) {
  const model = preferredModel || 'gen4.5';
  if (model === 'gen4_turbo' && !promptImage) {
    const err = new Error('[Runway] gen4_turbo requires a product image (I2V only). Upload an image before generating.');
    (err as any).apiSource = 'runway';
    throw err;
  }

  let res: { id: string } | null = null;
  let lastErr: any = null;
  
  {
    const mid = model;
    try {
      console.log(`[RUNWAY] [TASK] Model: ${mid} | I2V: ${!!promptImage} | Duration: ${duration}s | Request Sent...`);
      
      const payload: any = {
        model: mid,
        promptText: visualPrompt,
        ratio,
        duration: duration,
      };

      if (promptImage) {
        // Runway imageToVideo requires an HTTPS URL or Runway URI — base64 is NOT supported.
        // Upload the image first, then pass the returned runway:// URI.
        let imageUri = promptImage;
        if (promptImage.startsWith('data:')) {
          const resizedDataUri = await resizeImageForRunway(promptImage, ratio);
          const match = resizedDataUri.match(/^data:[^;]+;base64,(.+)$/);
          const buffer = Buffer.from(match![1], 'base64');
          const file = await toFile(buffer, 'product.jpg', { type: 'image/jpeg' });
          const uploaded = await runway.uploads.createEphemeral({ file });
          imageUri = uploaded.uri;
          console.log(`[RUNWAY] Image uploaded as ephemeral: ${imageUri}`);
        }
        payload.promptImage = [{ position: 'first', uri: imageUri }];
        console.log(`[RUNWAY] Payload model: ${payload.model} | ratio: ${payload.ratio} | duration: ${payload.duration}`);
        const method = (runway as any).imageToVideo || runway.textToVideo;
        res = await (method as any).create(payload);
      } else {
        // Không có ảnh → gen4.5 (T2V)
        res = await (runway.textToVideo as any).create(payload);
      }
      
    } catch (e: any) {
      const runwayErr = new Error(`[Runway] ${e?.message || 'Unknown Runway error'}`);
      (runwayErr as any).apiSource = 'runway';
      lastErr = runwayErr;
      console.warn(`[RUNWAY-TASK] ${mid} failed:`, e?.message || e);
    }
  }

  if (!res) throw lastErr || (() => { const e = new Error('[Runway] Runway generation failed'); (e as any).apiSource = 'runway'; return e; })();

  let task = await runway.tasks.retrieve(res.id);
  let pollErrorCount = 0;
  const MAX_POLL_ERRORS = 15; // Giới hạn 15 lần lỗi liên tiếp (chịu đựng mất kết nối khoảng 1.5 phút)

  while (task.status !== 'SUCCEEDED' && task.status !== 'FAILED') {
    await new Promise(r => setTimeout(r, 5000)); // Optimized to 5s
    try {
      task = await runway.tasks.retrieve(res.id);
      pollErrorCount = 0; // Gọi thành công -> reset bộ đếm
    } catch (pollErr: any) {
      pollErrorCount++;
      console.warn(`[RUNWAY] Poll error for task ${res.id} (Count: ${pollErrorCount}/${MAX_POLL_ERRORS}):`, pollErr.message);
      
      if (pollErrorCount >= MAX_POLL_ERRORS) {
        const finalErr = new Error(`Runway API Timeout/Error persisted after ${MAX_POLL_ERRORS} attempts: ${pollErr.message}`);
        (finalErr as any).apiSource = 'runway';
        throw finalErr;
      }

      // Bỏ qua lỗi timeout (Request timed out) hoặc lỗi server từ Runway để không làm crash pipeline
      if (pollErr.message?.toLowerCase().includes('timeout') || pollErr.status >= 500 || pollErr.status === 429) {
        continue;
      }
      throw pollErr;
    }
  }

  if (task.status === 'SUCCEEDED') {
    return (task as any).output?.[0] || '';
  }
  console.error('[RUNWAY] Task FAILED. Full task object:', JSON.stringify(task, null, 2));
  const failureReason = (task as any).failure || (task as any).failureCode || (task as any).error || (task as any).failureMessage || 'Unknown error';
  const taskErr = new Error(`[Runway] Runway task failed (${task.status}): ${failureReason}`);
  (taskErr as any).apiSource = 'runway';
  throw taskErr;
}

/**
 * Tạo JWT Token cho Kling AI
 */
function generateKlingToken(accessKey: string, secretKey: string) {
  const payload = {
    iss: accessKey,
    exp: Math.floor(Date.now() / 1000) + 1800,
    nbf: Math.floor(Date.now() / 1000) - 5
  };
  return jwt.sign(payload, secretKey, { algorithm: 'HS256' });
}

/**
 * Xử lý tạo video bằng Kling AI (T2V & I2V)
 */
async function generateKlingVideoTask(
  token: string,
  visualPrompt: string,
  ratio: string,
  duration: number,
  promptImage?: string
) {
  const endpoint = promptImage 
    ? 'https://api.klingai.com/v1/videos/image2video'
    : 'https://api.klingai.com/v1/videos/text2video';

  const body: any = {
    model: 'kling-v3', // Sử dụng model v3 mới nhất
    prompt: visualPrompt,
    aspect_ratio: ratio === '1280:720' ? '16:9' : '9:16',
    duration: duration === 5 ? '5' : '10',
    mode: 'std', // Mặc định chế độ cân bằng như yêu cầu
  };

  if (promptImage) {
    // Letterbox resize để ảnh fill đúng tỉ lệ khung trước khi gửi (giống Runway)
    const resized = await resizeImageForRunway(promptImage, ratio);
    // Kling nhận pure base64, không nhận data URL prefix (data:image/...;base64,)
    body.image = resized.includes('base64,') ? resized.split('base64,')[1] : resized;
  }

  console.log(`[KLING] [TASK] Model: ${body.model} | I2V: ${!!promptImage} | Request Sent...`);

  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  const data = await resp.json();
  if (data.code !== 0) { const kErr = new Error(`[Kling] ${data.message}`); (kErr as any).apiSource = 'kling'; throw kErr; }

  const taskId = data.data.task_id;
  
  // Polling trạng thái task
  let taskStatus = 'QUEUED';
  let videoUrl = '';
  let attempts = 0;

  while (attempts < 60) { // Tối đa 5 phút (60 * 5s)
    await new Promise(r => setTimeout(r, 5000));
    const statusResp = await fetch(`https://api.klingai.com/v1/videos/tasks/${taskId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const statusData = await statusResp.json();
    
    if (statusData.code !== 0) { const kqErr = new Error(`[Kling] ${statusData.message}`); (kqErr as any).apiSource = 'kling'; throw kqErr; }
    
    taskStatus = statusData.data.task_status;
    if (taskStatus === 'SUCCEEDED') {
      videoUrl = statusData.data.task_result.videos[0].url;
      break;
    } else if (taskStatus === 'FAILED') {
      const ktErr = new Error(`[Kling] Task failed: ${statusData.data.task_status_msg}`); (ktErr as any).apiSource = 'kling'; throw ktErr;
    }
    attempts++;
  }

  if (!videoUrl) { const ktmErr = new Error('[Kling] Video generation timed out'); (ktmErr as any).apiSource = 'kling'; throw ktmErr; }
  return videoUrl;
}

/**
 * Xử lý tạo video bằng Google Veo 3.1 Fast (T2V & I2V)
 */
async function generateVeoVideoTask(
  apiKey: string,
  visualPrompt: string,
  ratio: string,
  duration: number,
  promptImage?: string
) {
  // Veo models theo đúng tên Google AI Studio:
  //   veo-3.0-fast-generate-preview → "Veo 3 Fast Generate" (~15 credits/s)
  //   veo-3.0-generate-preview      → "Veo 3 Generate" (~40 credits/s, fallback)
  // NOTE: Cần Paid plan để dùng Veo (Free plan quota = 0)


  const body: any = {
    prompt: visualPrompt,
    videoConfig: {
      durationSeconds: duration,
      aspectRatio: ratio === '1280:720' ? '16:9' : '9:16',
      // generateAudio không được hỗ trợ ở model fast → bỏ qua, FPT.ai xử lý voice
    }
  };

  if (promptImage) {
    // Letterbox resize để ảnh fill đúng tỉ lệ khung trước khi gửi (giống Runway)
    const resized = await resizeImageForRunway(promptImage, ratio);
    body.imageInput = {
      image: {
        mimeType: 'image/jpeg',
        data: resized.includes('base64,') ? resized.split('base64,')[1] : resized,
      }
    };
  }

  // Model fallback: Veo 3 Fast → Veo 3 Standard nếu fast chưa khả dụng
  const VEO_MODELS = ['veo-3.0-fast-generate-preview', 'veo-3.0-generate-preview'];
  let videoUrl = '';
  let lastVeoErr: any = null;

  for (const modelId of VEO_MODELS) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateVideo?key=${apiKey}`;
      console.log(`[VEO] [TASK] Model: ${modelId} | I2V: ${!!promptImage} | Duration: ${duration}s | Request Sent...`);

      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      // Đọc text trước để tránh crash nếu body rỗng hoặc không phải JSON
      const rawText = await resp.text();
      if (!rawText) {
        throw new Error(`[Veo] Empty response from API (HTTP ${resp.status}) for model ${modelId}`);
      }
      let data: any;
      try { data = JSON.parse(rawText); } catch {
        throw new Error(`[Veo] Non-JSON response (HTTP ${resp.status}): ${rawText.slice(0, 200)}`);
      }

      if (data.error) {
        const msg = data.error.message || JSON.stringify(data.error);
        // Nếu lỗi do model không tồn tại → thử model fallback tiếp theo
        if (resp.status === 404 || msg.includes('not found') || msg.includes('not supported')) {
          console.warn(`[VEO] Model ${modelId} unavailable, trying fallback...`);
          lastVeoErr = new Error(`[Veo] ${msg}`);
          continue;
        }
        const vErr = new Error(`[Veo] ${msg}`);
        (vErr as any).apiSource = 'veo';
        throw vErr;
      }

      const operationName = data.name;
      if (!operationName) throw new Error(`[Veo] No operation name returned by ${modelId}`);

      let attempts = 0;
      while (attempts < 60) {
        await new Promise(r => setTimeout(r, 5000));
        const statusResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${apiKey}`);
        const statusRaw = await statusResp.text();
        const statusData = statusRaw ? JSON.parse(statusRaw) : {};

        if (statusData.error) { const vqErr = new Error(`[Veo] ${statusData.error.message}`); (vqErr as any).apiSource = 'veo'; throw vqErr; }

        if (statusData.done) {
          videoUrl = statusData.response?.video?.uri || statusData.response?.outputUri;
          break;
        }
        attempts++;
      }

      if (videoUrl) break; // thành công, thoát vòng lặp model
      lastVeoErr = new Error(`[Veo] Video generation timed out for model ${modelId}`);
    } catch (e: any) {
      if ((e.message || '').includes('fallback') || lastVeoErr) {
        lastVeoErr = e;
        continue; // thử model tiếp theo
      }
      (e as any).apiSource = 'veo';
      throw e;
    }
  }

  if (!videoUrl) {
    const finalErr = lastVeoErr || new Error('[Veo] All Veo models failed');
    (finalErr as any).apiSource = 'veo';
    throw finalErr;
  }
  return videoUrl;
}


export async function POST(req: Request) {
  try {
    const { scriptId: inputScriptId, manualScript, config } = await req.json();

    const runwayApiKey = req.headers.get('x-runway-api-key');
    const googleApiKey = req.headers.get('x-google-api-key');
    const fptApiKey = req.headers.get('x-fpt-api-key');
    const klingAccessKey = req.headers.get('x-kling-access-key');
    const klingSecretKey = req.headers.get('x-kling-secret-key');


    if (!googleApiKey) {
      throw new Error('[Gemini] Vui lòng cấu hình Google Gemini API Key trong phần Cài đặt.');
    }
    if (!fptApiKey) {
      throw new Error('[FPT.ai TTS] Vui lòng cấu hình FPT.ai API Key trong phần Cài đặt.');
    }
    
    const selectedModel = config?.model || 'runway';
    if (selectedModel === 'runway' && !runwayApiKey) {
      throw new Error('[Runway] Vui lòng cấu hình RunwayML API Key trong phần Cài đặt.');
    }
    if (selectedModel === 'kling' && (!klingAccessKey || !klingSecretKey)) {
      throw new Error('[Kling] Vui lòng cấu hình Kling AI Access Key và Secret Key trong phần Cài đặt.');
    }
    
    let script: any = null;
    let finalScriptId = inputScriptId;

    if (finalScriptId) {
      script = await prisma.videoScript.findUnique({ 
        where: { id: finalScriptId },
        include: { project: true }
      });
    }

    let scenes: any[] = [];
    let fullAudioScript = '';
    const defaultProjectId = '123e4567-e89b-12d3-a456-426614174000';
    
    // --- DURATION LOGIC (STITCHING) - Moved up ---
    const durationStr = String(config?.duration || '10s');

    // Convert to human-readable for Gemini prompt
    const humanDuration = (() => {
      const cm = durationStr.match(/^custom:(\d+)$/);
      if (cm) return `${cm[1]} giây`;
      if (durationStr.includes('m')) return `${parseInt(durationStr)} phút`;
      return durationStr;
    })();

     if (manualScript && manualScript.trim()) {
        scenes = await refineManualScript(manualScript, googleApiKey || '', humanDuration, config?.emotion, config?.style || config?.activeStyle, config?.tone);
        const newScript = await prisma.videoScript.create({
          data: {
              project: { connect: { id: script?.projectId || defaultProjectId } },
              content: JSON.stringify({ scenes })
          }
        });
        script = newScript;
        finalScriptId = newScript.id;
     } else if (script) {
        const content = typeof script.content === 'string' ? JSON.parse(script.content) : script.content;
        if (Array.isArray(content)) {
          scenes = content;
        } else if (content && typeof content === 'object') {
          scenes = content.scenes || [];
          fullAudioScript = content.fullAudioScript || '';
        }
     }

    if (!scenes || scenes.length === 0) return NextResponse.json({ error: 'No script' }, { status: 400 });

    const runway = new RunwayML({ apiKey: runwayApiKey || 'mock-key' });
    const newGen = await prisma.videoGeneration.create({
      data: {
        project: { connect: { id: script?.projectId || defaultProjectId } },
        script: finalScriptId ? { connect: { id: finalScriptId } } : undefined,
        generationNo: 1,
        resolution: config?.resolution || '720p',
        aspectRatio: config?.aspectRatio || '16:9',
        status: 'processing',
      }
    });
    const generationId = newGen.id;

    const audioDir = path.join(process.cwd(), 'public', 'audio');
    const videoDir = path.join(process.cwd(), 'public', 'videos');
    if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });
    if (!fs.existsSync(videoDir)) fs.mkdirSync(videoDir, { recursive: true });

    // --- PREPARE DATA ---
    const totalAudioScript = (fullAudioScript && fullAudioScript.trim()) 
      ? fullAudioScript 
      : scenes.map((s: any) => s.audioScript).filter(Boolean).join('... ');

    const configData = (() => {
      const content = typeof script?.content === 'string' ? JSON.parse(script.content) : script?.content;
      return content?.config || {};
    })();
    const characterId = config?.characterId || configData.characterId || '';
    const characterType = config?.characterType || configData.characterType || '';
    const mainCharacter = config?.mainCharacter || configData.mainCharacter || '';
    const locationContextRaw = config?.locationContext || configData.locationContext || '';
    const locationMap: Record<string, string> = {
      'Tại cửa hàng': 'inside the store',
      'Trung tâm thương mại': 'inside a shopping mall',
      'Nhà bếp hiện đại': 'in a modern kitchen',
      'Quầy thực phẩm': 'at a food counter',
      'Ngoài trời / Đường phố': 'outdoor street setting',
    };
    const locationContext = locationMap[locationContextRaw] || locationContextRaw.replace(/[^\x00-\x7F]/g, '').trim() || 'a cinematic indoor setting';

    // --- SOURCE OF TRUTH: Lookup gender and English description from CHARACTERS constant ---
    const charDefinition = CHARACTERS.find((c: any) => c.id === characterId);
    const resolvedGender = charDefinition?.gender || characterType; 
    const genderInEng = resolvedGender === 'Nam' ? 'Male' : (resolvedGender === 'Nữ' ? 'Female' : '');
    
    // Ưu tiên dùng mô tả tiếng Anh để AI (Runway/Kling) hiểu chính xác nhân vật
    let englishCharacterDesc = charDefinition?.englishDescription || "";

    // Dịch tự động nhân vật tùy chỉnh sang tiếng Anh
    if (!englishCharacterDesc && mainCharacter && googleApiKey) {
      try {
        console.log(`[PIPELINE] Translating custom character description...`);
        const ai = new GoogleGenAI({ apiKey: googleApiKey });
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite-preview',
            contents: `Translate this Vietnamese character description to a concise English prompt for an AI video generator. Focus on visual appearance, clothing, and expression. Max 25 words. No explanations. Description: "${mainCharacter}"`,
        });
        englishCharacterDesc = response.text?.trim() || `${genderInEng} character`;
        console.log(`[PIPELINE] Translated custom character: ${englishCharacterDesc}`);
      } catch (e) {
        console.error('[PIPELINE] Custom char translation failed:', e);
        englishCharacterDesc = `${genderInEng} character`;
      }
    } else if (!englishCharacterDesc) {
      englishCharacterDesc = `Vietnamese ${genderInEng.toLowerCase()} person with black hair and East Asian features`;
    }

    // --- DURATION LOGIC (STITCHING) ---
    let totalSeconds = 10;
    // Support custom:XX format from frontend
    const customMatch = durationStr.match(/^custom:(\d+)$/);
    if (customMatch) {
      totalSeconds = parseInt(customMatch[1]) || 10;
    } else if (durationStr.includes('m')) {
      totalSeconds = parseInt(durationStr) * 60;
    } else {
      totalSeconds = parseInt(durationStr) || 10;
    }

    const maxClipDur = selectedModel === 'veo' ? 8 : selectedModel === 'kling' ? 5 : 10;
    const numClips = Math.ceil(totalSeconds / maxClipDur);
    const clipsConfig = [];

    for (let i = 0; i < numClips; i++) {
        let clipDur = maxClipDur;
        if (i === numClips - 1) {
            const remaining = totalSeconds % maxClipDur;
            clipDur = remaining === 0 ? maxClipDur : remaining;
            if (selectedModel === 'runway') {
                // Runway chỉ nhận 5 hoặc 10
                clipDur = clipDur <= 5 ? 5 : 10;
            } else if (selectedModel === 'kling') {
                // Kling v3 chỉ nhận 5s
                clipDur = 5;
            } else if (selectedModel === 'veo') {
                // Veo minimum ~5s — clip quá ngắn sẽ bị reject, round lên 5s
                if (clipDur < 5) clipDur = 5;
            }
        }
        clipsConfig.push({ index: i, duration: clipDur });
    }

    const actualTotalSeconds = clipsConfig.reduce((sum, c) => sum + c.duration, 0);

    const motionIntensity = Number(config?.motionIntensity ?? 50);
    const motionKeyword = motionIntensity > 70 ? "Fluid cinematic motion" : "Stable shot, locked geometry";
    const ratio = config?.aspectRatio === '16:9' ? '1280:720' : '720:1280';
    const audioFileName = `fpt_${finalScriptId}.mp3`;
    const audioFilePath = path.join(audioDir, audioFileName);
    // --- RESOLVE PRODUCT IMAGE ---
    let finalProductImage = config?.productImage || configData.savedProductImageUrl;
    if (finalProductImage && finalProductImage.startsWith('/')) {
      try {
        const fullImagePath = path.join(process.cwd(), 'public', finalProductImage);
        if (fs.existsSync(fullImagePath)) {
          console.log(`[PIPELINE] Reading local product image: ${fullImagePath}`);
          const imageBuffer = fs.readFileSync(fullImagePath);
          const ext = path.extname(fullImagePath).slice(1) || 'png';
          finalProductImage = `data:image/${ext};base64,${imageBuffer.toString('base64')}`;
        }
      } catch (imgErr) {
        console.error('[PIPELINE-IMAGE-ERROR] Failed to read local image:', imgErr);
      }
    }
    const productImage = finalProductImage;

    // --- PIPELINE: GENERATE ALL CLIPS ---
    console.log(`[PIPELINE] Multi-clip Generation: ${numClips} clips for ${totalSeconds}s total using ${selectedModel.toUpperCase()}.`);
    
    // Gen Audio in parallel with video batch
    const audioPromise = config?.voiceOver !== false
        ? generateAudioTask(totalAudioScript, config, finalScriptId, audioDir, audioFilePath, fptApiKey || undefined)
        : Promise.resolve('');

    const videoTasks = clipsConfig.map(async (c, i) => {
        // Phân bổ scenes cho clip này (nguyên tắc chia đều % thời gian)
        const startIdx = Math.floor((i / numClips) * scenes.length);
        const endIdx = Math.floor(((i + 1) / numClips) * scenes.length);
        const clipScenes = scenes.slice(startIdx, Math.max(endIdx, startIdx + 1));
        
        const combinedDesc = clipScenes.map(s => `${s.visualDescription} ${s.technicalKeywords}`).join(' ');
        
        // Food là HERO, character là PHỤ — nhất quán qua tất cả clip
        const continuityNote = i > 0
            ? `CONTINUITY: Identical food appearance and ${locationContext} setting as previous clip. Same character.`
            : `OPENING: Begin with extreme macro close-up of the food.`;

        // === UNIVERSAL VIDEO NARRATIVE RULES ===
        // Rule 1: Food opens the video and stays as hero throughout.
        // Rule 2: Food must be 100% identical to reference at all times — no distortion, no added props.
        // Rule 3: Camera pulls back to reveal Vietnamese character nearby (not touching food).
        // Rule 4: Character smiles, speaks naturally, light body language — real 3D person, NOT a banner/cutout/statue.
        // Rule 5: Background clearly depicts the chosen location setting.
        const style = config?.style || config?.activeStyle || 'cinematic';
        const isGen4Turbo = selectedModel === 'runway' && config?.runwayModel === 'gen4_turbo' && !!productImage;
        const styleNote = `${style} food marketing style, 4K warm cinematic lighting. ${motionKeyword}.`;
        const emotionNote = config?.emotion ? emotionToVisual(config.emotion) : '';
        const toneNote = config?.tone ? toneToVisual(config.tone) : '';

        // ai_character dùng 3D animated style — không dùng "realistic skin texture"
        const isAiCharacter = characterId === 'ai_character';
        const depthNote = isAiCharacter
          ? 'Stylized 3D depth, expressive animated character design (Pixar/Disney style).'
          : 'Full 3D depth, realistic skin texture.';

        // FOOD PHASE nói rõ "macro close-up — character just outside frame" để giải thích
        // tại sao character chưa thấy, tránh mâu thuẫn với "already present" trong REVEAL PHASE.
        // Tránh "camera pulls back revealing" — video AI đọc là split/wipe/PiP transition.
        const charReveal = `The camera angle widens naturally — ${englishCharacterDesc}, who has been standing just outside the initial tight frame, comes into view beside the food in ${locationContext}. Same continuous unbroken 3D scene, no cut, no transition. Character looks toward camera with a genuine warm smile, natural head nods and gentle hand gestures as if describing the food. Minimal physical contact with food. ${depthNote} Background shows ${locationContext}. NOT a split screen, NOT a composite, NOT picture-in-picture, NOT a banner, NOT a cutout.`;

        // Compact Vietnamese character desc cho gen4_turbo — đủ để Runway nhận diện đúng appearance
        const roleMap: Record<string, string> = {
          'male_chef':       'male chef in white chef uniform',
          'lady_consultant': 'female consultant in professional attire',
          'food_reviewer':   'young male food reviewer in casual outfit',
          'female_vlogger':  'young female vlogger in casual outfit',
          'friendly_owner':  'middle-aged male restaurant owner in casual clothes',
          'mom_chef':        'motherly female in home attire',
          'ai_character':    'cute 3D animated character',
        };
        const charRole = roleMap[characterId] || `${genderInEng.toLowerCase()} person`;
        const compactVietnameseDesc = isAiCharacter
          ? 'A cute 3D animated character (Pixar/Disney style)'
          : `A Vietnamese ${charRole} with straight jet-black hair, dark brown eyes, and warm golden skin`;

        const visualPrompt = isGen4Turbo
            ? [
                // Gen-4 Turbo I2V: reference image IS the first frame.
                // ONE unified scene description — no temporal phases (Runway reads them as vertical spatial splits).
                // "walks into" → entrance motion into the open upper area, not static placement.
                `Cinematic food marketing video, single continuous shot, no cuts.`,
                `The food from the reference image fills the foreground — preserve 100%: exact shape, embossed patterns, brand markings, color, pixel-identical throughout. Zero morphing, zero distortion.`,
                `${compactVietnameseDesc} walks into the open upper portion of the frame from the side, settling behind the food display — waist-up, mid-distance from camera. Food stays closer and larger in frame. Character smiles warmly toward camera, lips moving as if speaking and introducing the food, gentle head nods and light hand gestures.`,
                `Slow gentle camera drift. ${depthNote} ${locationContext}.`,
                `NOT split screen, NOT picture-in-picture, NOT face close-up. One unified 3D scene.`,
                styleNote, emotionNote, toneNote,
              ].filter(Boolean).join(' ')
            : productImage
              ? [
                  `Single continuous cinematic shot, no cuts.`,
                  `FOOD PHASE (first 50%): Macro/medium close-up of the food dominates screen time — character is just outside this tight frame. CRITICAL: preserve 100% exact shape, all surface patterns and embossed details, brand text, color tone — unchanged across every single frame. Only slow smooth camera motion. ZERO morphing, ZERO distortion, ZERO prop changes at any moment.`,
                  `REVEAL PHASE (final 50%): ${charReveal}`,
                  styleNote, continuityNote, emotionNote, toneNote,
                  config?.transitions === false ? `No cuts.` : '',
                ].filter(Boolean).join(' ')
              : [
                  `Single continuous cinematic shot, no cuts.`,
                  `FOOD PHASE (first 50%): ${combinedDesc.slice(0, 180)} opens the video in a macro close-up — character just outside this tight frame. Photorealistic rendering, perfectly consistent shape, color, and texture from first to last frame. ZERO morphing.`,
                  `REVEAL PHASE (final 50%): ${charReveal}`,
                  styleNote, continuityNote, emotionNote, toneNote,
                  config?.transitions === false ? `No cuts.` : '',
                ].filter(Boolean).join(' ');

        // Runway: hard cap 1000 chars. Kling/Veo: up to 1500 chars.
        const promptMaxLen = (selectedModel === 'kling' || selectedModel === 'veo') ? 1500 : 1000;
        const rawPrompt = visualPrompt;
        const finalVisualPrompt = rawPrompt.length <= promptMaxLen
          ? rawPrompt
          : (() => { const t = rawPrompt.slice(0, promptMaxLen - 3); const s = t.lastIndexOf('. '); return s > promptMaxLen * 0.7 ? rawPrompt.slice(0, s + 1) : t + '...'; })();

        if (selectedModel === 'kling') {
            return generateKlingVideoTask(generateKlingToken(klingAccessKey!, klingSecretKey!), finalVisualPrompt, ratio, c.duration, productImage);
        } else if (selectedModel === 'veo') {
            return generateVeoVideoTask(googleApiKey!, finalVisualPrompt, ratio, c.duration, productImage);
        } else {
            return generateVideoTask(runway, finalVisualPrompt, ratio, c.duration, productImage, config?.runwayModel);
        }
    });

    // --- PIPELINE EXECUTION: Audio & Video chạy ĐỘC LẬP ---
    // Audio luôn được chờ hoàn thành, không bị ảnh hưởng bởi video fail
    const [audioResult, ...videoResults] = await Promise.allSettled([audioPromise, ...videoTasks]);

    // --- Xử lý Audio (luôn lưu dù video fail) ---
    const audioUrl = audioResult.status === 'fulfilled' ? (audioResult.value as string) : '';
    if (audioResult.status === 'rejected') {
        console.error('[PIPELINE-AUDIO-ERROR]', audioResult.reason);
    } else if (audioUrl) {
        console.log(`[PIPELINE] Audio saved successfully: ${audioUrl}`);
    }

    // --- Xử lý Video ---
    const failedClips = videoResults.filter(r => r.status === 'rejected');
    const succeededClips = videoResults.filter(r => r.status === 'fulfilled') as PromiseFulfilledResult<string>[];
    const rawVideoUrls = succeededClips.map(r => r.value);

    if (failedClips.length > 0) {
        const firstError = (failedClips[0] as PromiseRejectedResult).reason;
        console.error(`[PIPELINE-VIDEO-ERROR] ${failedClips.length}/${videoResults.length} clips failed. First error:`, firstError?.message || firstError);
    }

    // Nếu KHÔNG có clip video nào thành công
    if (rawVideoUrls.length === 0) {
        const videoError = (failedClips[0] as PromiseRejectedResult)?.reason;
        await prisma.videoGeneration.update({ where: { id: generationId }, data: { status: 'failed' } });
        
        // Vẫn lưu scene với audio nếu có
        if (audioUrl) {
            await prisma.videoScene.create({
              data: {
                generationId,
                sceneOrder: 1,
                visualPrompt: `Video generation failed - Audio only`,
                audioScript: totalAudioScript,
                videoClipUrl: '',
                audioUrl,
              },
            });
        }
        
        // Extract API source from error for frontend toast
        const apiSource = (videoError as any)?.apiSource || 'unknown';
        return NextResponse.json({ 
            error: videoError?.message || 'Video generation failed',
            apiSource,
            audioUrl: audioUrl || undefined,
            partialSuccess: !!audioUrl,
        }, { status: 500 });
    }

    try {
        // --- FFmpeg STITCHING ---
        let finalVideoUrl = rawVideoUrls[0];
        const finalVideoName = `final_${finalScriptId}.mp4`;
        const finalVideoPath = path.join(videoDir, finalVideoName);
        
        console.log(`[FFMPEG] Stitching ${rawVideoUrls.length} clips into one long video...`);
        const { execSync } = require('child_process');
        const ffmpegPath = path.join(process.cwd(), 'bin', 'ffmpeg.exe');
        
        // Tạo file list.txt cho concat
        const listPath = path.join(videoDir, `list_${finalScriptId}.txt`);
        let listContent = "";
        
        for (let i = 0; i < rawVideoUrls.length; i++) {
            const tmpPath = path.join(videoDir, `part_${i}_${finalScriptId}.mp4`);
            const vResp = await fetch(rawVideoUrls[i]);
            const vBuffer = Buffer.from(await vResp.arrayBuffer());
            fs.writeFileSync(tmpPath, vBuffer);
            listContent += `file 'part_${i}_${finalScriptId}.mp4'\n`;
        }
        fs.writeFileSync(listPath, listContent);

        // Nối video và lồng audio
        // Nếu chỉ có 1 clip → dùng trực tiếp, bỏ qua bước concat để tránh file corrupt
        let rawVideoOnlyPath: string;

        if (rawVideoUrls.length === 1) {
            // Trường hợp 1 clip: download và dùng trực tiếp
            rawVideoOnlyPath = path.join(videoDir, `part_0_${finalScriptId}.mp4`);
            console.log(`[FFMPEG] Single clip — skipping concat, using downloaded file directly.`);
        } else {
            // Trường hợp nhiều clip: Bước 1 — Concat video (không có audio)
            rawVideoOnlyPath = `${finalVideoPath}.tmp.mp4`;
            // Tạo list.txt với absolute path để tránh lỗi path resolution trên Windows
            const listContent2 = rawVideoUrls.map((_, i) =>
                `file '${path.join(videoDir, `part_${i}_${finalScriptId}.mp4`).replace(/\\/g, '/')}'`
            ).join('\n');
            fs.writeFileSync(listPath, listContent2);
            const concatOnlyCmd = `"${ffmpegPath}" -y -f concat -safe 0 -i "${listPath}" -c:v copy -an "${rawVideoOnlyPath}"`;
            console.log(`[FFMPEG] Concat ${rawVideoUrls.length} clips...`);
            execSync(concatOnlyCmd, { cwd: videoDir, timeout: 600000 });
        }

        // Bước cuối: Merge audio vào video
        // -movflags +faststart: đảm bảo moov atom ở đầu file → không bị corrupt khi phát
        const mergeCmd = fs.existsSync(audioFilePath)
            ? `"${ffmpegPath}" -y -i "${rawVideoOnlyPath}" -i "${audioFilePath}" -filter_complex "[1:a]apad[aout]" -map 0:v:0 -map "[aout]" -c:v copy -c:a aac -b:a 128k -shortest -movflags +faststart "${finalVideoPath}"`
            : `"${ffmpegPath}" -y -i "${rawVideoOnlyPath}" -c:v copy -movflags +faststart "${finalVideoPath}"`;
            
        console.log(`[FFMPEG] Merging audio: ${fs.existsSync(audioFilePath) ? 'YES' : 'NO AUDIO'}`);
        execSync(mergeCmd, { cwd: videoDir, timeout: 600000 });
        
        // Dọn dẹp file tmp
        const tmpConcatPath = `${finalVideoPath}.tmp.mp4`;
        if (fs.existsSync(tmpConcatPath)) fs.unlinkSync(tmpConcatPath);
        finalVideoUrl = `/api/media/videos/${finalVideoName}`;
        console.log(`[FFMPEG] STITCH SUCCESS: ${finalVideoUrl}`);

        // Cleanup
        rawVideoUrls.forEach((_, i) => {
            const p = path.join(videoDir, `part_${i}_${finalScriptId}.mp4`);
            if (fs.existsSync(p)) fs.unlinkSync(p);
        });
        if (fs.existsSync(listPath)) fs.unlinkSync(listPath);

        const dbScene = await prisma.videoScene.create({
          data: { 
            generationId, 
            sceneOrder: 1, 
            visualPrompt: `Multi-clip Stitched (${rawVideoUrls.length} clips)`, 
            audioScript: totalAudioScript, 
            videoClipUrl: finalVideoUrl, 
            audioUrl,
            metadata: JSON.stringify({ clips: rawVideoUrls })
          },
        });
        await prisma.videoGeneration.update({ where: { id: generationId }, data: { status: 'completed' } });
        return NextResponse.json({ success: true, results: [dbScene], requestedDuration: totalSeconds, actualDuration: actualTotalSeconds });

    } catch (pipelineErr: any) {
        console.error('[PIPELINE-ERROR]', pipelineErr);
        await prisma.videoGeneration.update({ where: { id: generationId }, data: { status: 'failed' } });
        throw pipelineErr;
    }
  } catch (error: any) {
    console.error('[API-CRITICAL]', error);
    return NextResponse.json({ error: error.message, apiSource: error.apiSource || 'unknown' }, { status: 500 });
  }
}
