import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import RunwayML from '@runwayml/sdk';
import { GoogleGenAI } from '@google/genai';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { CHARACTERS, VOICES } from '../../../../lib/constants';

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
  
  const prompt = `Bạn là chuyên gia hiệu đính kịch bản điện ảnh. 
Hãy trau chuốt kịch bản đồ ăn sau thành phiên bản Cinematic chuyên nghiệp nhưng vẫn tự nhiên: "${rawText}".

YÊU CẦU:
1. Video này có thời lượng mục tiêu là ${targetDuration}. Hãy phân tách nội dung gốc thành số lượng cảnh quay hợp lý để phủ kín thời lượng này (Ví dụ: Video 15-30s cần khoảng 3-5 cảnh, Video 3-5 phút cần ít nhất 7-10 cảnh trở lên).
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
      const is429 = e.status === 429 || errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED');

      if (is503 && attempts < maxAttempts) {
        console.log(`[GEMINI-RETRY-VIDEO] 503 High Demand. Attempt ${attempts}...`);
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
      await new Promise(r => setTimeout(r, 3000));
      
      const maxPolls = 20; // 20 polls × 3s = 60s
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
        return `/audio/fpt_${finalScriptId}.mp3`;
      } catch (padErr) {
        console.error(`[FPT-AI-PAD-ERROR]`, padErr);
        fs.writeFileSync(audioFilePath, audioBuffer);
        return `/audio/fpt_${finalScriptId}.mp3`;
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
  promptImage?: string
) {
  const MODELS_PRIORITY = ['gen4.5'];
  let res: { id: string } | null = null;
  let lastErr: any = null;
  
  for (const mid of MODELS_PRIORITY) {
    try {
      console.log(`[RUNWAY] [TASK] Model: ${mid} | I2V: ${!!promptImage} | Duration: ${duration}s | Request Sent...`);
      
      const payload: any = {
        model: mid,
        promptText: visualPrompt,
        ratio,
        duration: duration,
      };

      if (promptImage) {
        payload.promptImage = promptImage;
        // Search results indicate using client.imageToVideo for I2V
        // If the current SDK version doesn't have it, we fallback to textToVideo as they often overlap
        const method = (runway as any).imageToVideo || runway.textToVideo;
        res = await (method as any).create(payload);
      } else {
        res = await (runway.textToVideo as any).create(payload);
      }
      
      if (res) break;
    } catch (e: any) {
      const runwayErr = new Error(`[Runway] ${e?.message || 'Unknown Runway error'}`);
      (runwayErr as any).apiSource = 'runway';
      lastErr = runwayErr;
      console.warn(`[RUNWAY-TASK] ${mid} failed:`, e?.message || e);
    }
  }

  if (!res) throw lastErr || (() => { const e = new Error('[Runway] Runway generation failed'); (e as any).apiSource = 'runway'; return e; })();

  let task = await runway.tasks.retrieve(res.id);
  while (task.status !== 'SUCCEEDED' && task.status !== 'FAILED') {
    await new Promise(r => setTimeout(r, 5000)); // Optimized to 5s
    task = await runway.tasks.retrieve(res.id);
  }

  if (task.status === 'SUCCEEDED') {
    return (task as any).output?.[0] || '';
  }
  const taskErr = new Error(`[Runway] Runway task failed: ${task.status}`);
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
    // Kling mong muốn URL ảnh hoặc base64 tùy phiên bản, 
    // ở đây giả định là URL đã được xử lý từ frontend
    body.image = promptImage;
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
  const modelId = 'veo-3.1-generate-001';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateVideo?key=${apiKey}`;

  const body: any = {
    prompt: visualPrompt,
    videoConfig: {
      durationSeconds: duration,
      aspectRatio: ratio === '1280:720' ? '16:9' : '9:16',
    }
  };

  if (promptImage) {
    const mimeMatch = promptImage.match(/^data:([^;]+);/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
    body.imageInput = {
      image: {
        mimeType: mimeType,
        data: promptImage.includes('base64,') ? promptImage.split('base64,')[1] : promptImage,
      }
    };
  }

  console.log(`[VEO] [TASK] Model: ${modelId} | I2V: ${!!promptImage} | Duration: ${duration}s | Request Sent...`);

  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const data = await resp.json();
  if (data.error) { const vErr = new Error(`[Veo] ${data.error.message}`); (vErr as any).apiSource = 'veo'; throw vErr; }

  const operationName = data.name;
  let videoUrl = '';
  let attempts = 0;

  while (attempts < 60) {
    await new Promise(r => setTimeout(r, 5000));
    const statusResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${apiKey}`);
    const statusData = await statusResp.json();

    if (statusData.error) { const vqErr = new Error(`[Veo] ${statusData.error.message}`); (vqErr as any).apiSource = 'veo'; throw vqErr; }

    if (statusData.done) {
      videoUrl = statusData.response?.video?.uri || statusData.response?.outputUri;
      break;
    }
    attempts++;
  }

  if (!videoUrl) { const vtmErr = new Error('[Veo] Video generation timed out'); (vtmErr as any).apiSource = 'veo'; throw vtmErr; }
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
    const hfApiKey = process.env.HUGGINGFACE_API_KEY;

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
    const characterId = configData.characterId || '';
    const characterType = configData.characterType || '';
    const mainCharacter = configData.mainCharacter || 'chef';
    const locationContext = configData.locationContext || 'kitchen';

    // --- SOURCE OF TRUTH: Lookup gender from CHARACTERS constant ---
    const charDefinition = CHARACTERS.find((c: any) => c.id === characterId);
    const resolvedGender = charDefinition?.gender || characterType; 
    const genderInEng = resolvedGender === 'Nam' ? 'Male' : (resolvedGender === 'Nữ' ? 'Female' : '');

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

    const maxClipDur = selectedModel === 'veo' ? 8 : 10;
    const numClips = Math.ceil(totalSeconds / maxClipDur);
    const clipsConfig = [];
    
    for (let i = 0; i < numClips; i++) {
        let clipDur = maxClipDur;
        if (i === numClips - 1) {
            const remaining = totalSeconds % maxClipDur;
            clipDur = remaining === 0 ? maxClipDur : remaining;
            // Runway/Kling only support 5 or 10. Round up.
            if (selectedModel !== 'veo') {
                clipDur = clipDur <= 5 ? 5 : 10;
            }
        }
        clipsConfig.push({ index: i, duration: clipDur });
    }

    const projectTopic = script?.project?.storyTopic || script?.project?.title || 'Delicious Food';
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
        
        // Context Injection để giữ tính nhất quán
        const consistencyContext = i > 0 
            ? `CONTINUITY: This is segment ${i+1} of a long sequence. Maintain exact same ${mainCharacter} appearance, clothing, and the ${locationContext} background from the previous clip. No jumping locations.` 
            : "START SCENE: High fidelity macro focus on food, then reveal character.";

        const visualPrompt = [
            `A ${c.duration}s cinematic 4k food marketing video.`,
            `Action: ${combinedDesc}`,
            consistencyContext,
            `Character: ${genderInEng} ${mainCharacter}, introducing product with active visible speech and natural expressions.`,
            `Product: High adherence to source image, 100% rigid geometry, no morphing.`,
            `Style: ${config?.style || config?.activeStyle || 'cinematic'}, professional lighting. ${motionKeyword}`,
            config?.emotion ? `Mood: ${config.emotion}.` : '',
            config?.tone ? `Tone: ${config.tone}.` : '',
            config?.transitions === false ? `No scene transitions, continuous shot.` : '',
            config?.charConsistency ? `Strictly maintain character facial consistency.` : ''
        ].filter(Boolean).join(' ').slice(0, 1000);

        if (selectedModel === 'kling') {
            return generateKlingVideoTask(generateKlingToken(klingAccessKey!, klingSecretKey!), visualPrompt, ratio, c.duration, productImage);
        } else if (selectedModel === 'veo') {
            return generateVeoVideoTask(googleApiKey!, visualPrompt, ratio, c.duration, productImage);
        } else {
            return generateVideoTask(runway, visualPrompt, ratio, c.duration, productImage);
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
        const mergeCmd = fs.existsSync(audioFilePath)
            ? `"${ffmpegPath}" -y -f concat -safe 0 -i "${listPath}" -i "${audioFilePath}" -filter_complex "[1:a]apad[aout]" -map 0:v -map "[aout]" -c:v libx264 -pix_fmt yuv420p -shortest "${finalVideoPath}"`
            : `"${ffmpegPath}" -y -f concat -safe 0 -i "${listPath}" -c:v libx264 -pix_fmt yuv420p "${finalVideoPath}"`;
            
        execSync(mergeCmd, { cwd: videoDir });
        finalVideoUrl = `/videos/${finalVideoName}`;
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
        return NextResponse.json({ success: true, results: [dbScene] });

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
