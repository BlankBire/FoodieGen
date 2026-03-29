import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import RunwayML from '@runwayml/sdk';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

/** 
 * Sử dụng Gemini (@google/genai) để "thông não" kịch bản thô.
 * Chuyển sang v1 để tránh lỗi 404 v1beta.
 */
async function refineManualScript(rawText: string, apiKey: string) {
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
  const modelId = 'gemini-2.5-flash'; 
  
  const prompt = `Cải thiện kịch bản quảng cáo đồ ăn sau: "${rawText}". 
  Hãy giữ nguyên số lượng các phân cảnh, đừng chia nhỏ thêm. 
  Trả về duy nhất dữ liệu dưới dạng JSON array: [{"sceneOrder":1, "title":"", "visualDescription":"", "audioScript":""}]. 
  Các mô tả hình ảnh cần cực kỳ chi tiết nhưng lời thoại phải ngắn gọn cho 5 giây.
  Đảm bảo kịch bản tự nhiên, hài hòa giữa hình ảnh và lời thoại tiếng Việt.`;

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
        await new Promise(r => setTimeout(r, 60000)); // Đợi 60 giây theo yêu cầu của Google
        continue;
      }
      
      throw e;
    }
  }
  
  const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const cleanJson = text.replace(/```json|```/g, '').trim();
  
  try {
    return JSON.parse(cleanJson);
  } catch (e) {
    const match = cleanJson.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);
    throw new Error('Không thể parse kịch bản hiệu chỉnh từ Gemini.');
  }
}

export async function POST(req: Request) {
  try {
    const { scriptId: inputScriptId, manualScript, config } = await req.json();

    const runwayApiKey = process.env.RUNWAYML_API_KEY;
    const googleApiKey = process.env.GOOGLE_API_KEY;
    const hfApiKey = process.env.HUGGINGFACE_API_KEY;
    
    let script: any = null;
    let finalScriptId = inputScriptId;

    if (finalScriptId) {
      script = await prisma.videoScript.findUnique({ where: { id: finalScriptId } });
    }

    let scenes: any[] = [];
    const defaultProjectId = '123e4567-e89b-12d3-a456-426614174000';

    if (manualScript && manualScript.trim()) {
       scenes = await refineManualScript(manualScript, googleApiKey || '');
       const newScript = await prisma.videoScript.create({
         data: {
             project: { connect: { id: script?.projectId || defaultProjectId } },
             content: scenes as any
         }
       });
       script = newScript;
       finalScriptId = newScript.id;
    } else if (script) {
       scenes = script.content as any[];
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

    // --- CONSOLIDATION FOR COST SAVING (CHẾ ĐỘ CHẮT CHIU) ---
    const totalAudioScript = scenes.map(s => s.audioScript).join('... ');
    const combinedVisualPrompt = scenes.map(s => s.visualDescription).join(' [TRANSITION] ').substring(0, 1000); 

    let audioUrl = '';
    const audioFileName = `combined_${finalScriptId}.mp3`;
    const audioFilePath = path.join(audioDir, audioFileName);

    if (totalAudioScript.trim()) {
      console.log(`[ELEVENLABS] Generating COMBINED TTS (Turbo v2.5)...`);
      // Sử dụng Voice ID mặc định (Adam & Rachel) - Chắc chắn tồn tại và hốt được tiếng Việt via Turbo v2.5
      const voiceId = config?.voiceGender === 'Nữ' ? '21m00Tcm4TlvDq8ikWAM' : 'pNInz6obpgDQGcFmaJgB';
      const elApiKey = process.env.ELEVENLABS_API_KEY;
      const elResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: 'POST',
          headers: { 'xi-api-key': elApiKey || '', 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            text: totalAudioScript,
            model_id: 'eleven_turbo_v2_5', // Model tối ưu nhất cho tiếng Việt 2026
            voice_settings: { stability: 0.5, similarity_boost: 0.75 }
          })
      });
      
      if (elResponse.ok) {
        const buffer = Buffer.from(await elResponse.arrayBuffer());
        fs.writeFileSync(audioFilePath, buffer);
        audioUrl = `/audio/${audioFileName}`;
        console.log(`[ELEVENLABS] SUCCESS. Audio saved to: ${audioFilePath}`);
      } else {
        const elErr = await elResponse.text();
        console.error(`[ELEVENLABS-ERROR] Status: ${elResponse.status}. Details: ${elErr}`);
      }
    }

    // veo3.1_fast là model khả dụng trong tài khoản của bạn.
    const RUNWAY_MODELS = ['veo3.1_fast'] as const;
    const visualPrompt = `A 6-second cinematic 4k video. ${combinedVisualPrompt}. Style: ${config?.style}. Photorealistic, raw, material texture. NO SMOKE, NO STEAM. High detailed lip sync facial features.`.slice(0, 1000);
    const ratio = config?.aspectRatio === '16:9' ? '1280:720' : '720:1280';
    const duration = 6; // Bắt buộc là 4, 6 hoặc 8 cho model này. 6s là hoàn hảo.

    console.log(`[RUNWAY] Generating SINGLE 6S VIDEO...`);
    let res: { id: string } | null = null;
    let lastErr: any = null;
    
    for (const modelId of RUNWAY_MODELS) {
      try {
        console.log(`[RUNWAY] Trying model: ${modelId}`);
        res = await (runway.textToVideo as any).create({
          model: modelId,
          promptText: visualPrompt,
          ratio,
          // Bỏ duration để Runway tự mặc định 5s, tránh lỗi validation 400
        });
        break;
      } catch (e: any) {
        lastErr = e;
        console.warn(`[RUNWAY] ${modelId} failed:`, e?.message || e);
        continue;
      }
    }

    if (!res) throw lastErr || new Error('Không có model Runway nào hoạt động');

    let task = await runway.tasks.retrieve(res.id);
    while (task.status !== 'SUCCEEDED' && task.status !== 'FAILED') {
      await new Promise(r => setTimeout(r, 7000));
      task = await runway.tasks.retrieve(res.id);
    }

    if (task.status === 'SUCCEEDED') {
      const rawVideoUrl = (task as any).output?.[0] || '';
      
      // --- FFmpeg MASHUP (EMBED AUDIO INTO VIDEO) ---
      let finalVideoUrl = rawVideoUrl;
      const finalVideoName = `final_${finalScriptId}.mp4`;
      const finalVideoPath = path.join(videoDir, finalVideoName);
      const tempVideoPath = path.join(process.cwd(), 'public', 'videos', `temp_${finalScriptId}.mp4`);

      // Kiểm tra xem audio có tồn tại không trước khi lồng
      if (fs.existsSync(audioFilePath)) {
        try {
          console.log(`[FFMPEG] Merging audio and video...`);
          // 1. Download raw video from Runway
          const vResp = await fetch(rawVideoUrl);
          const vBuffer = Buffer.from(await vResp.arrayBuffer());
          fs.writeFileSync(tempVideoPath, vBuffer);

          // 2. Run FFmpeg command
          const { execSync } = require('child_process');
          const ffmpegPath = path.join(process.cwd(), 'bin', 'ffmpeg.exe');
          
          execSync(`"${ffmpegPath}" -y -i "${tempVideoPath}" -i "${audioFilePath}" -c:v copy -c:a aac -map 0:v:0 -map 1:a:0 -shortest "${finalVideoPath}"`);
          
          finalVideoUrl = `/videos/${finalVideoName}`;
          console.log(`[FFMPEG] SUCCESS. Output: ${finalVideoUrl}`);
          
          // Cleanup temp file
          if (fs.existsSync(tempVideoPath)) fs.unlinkSync(tempVideoPath);
        } catch (ffErr) {
          console.error('[FFMPEG-ERROR] Merge failed, falling back to raw video:', ffErr);
          finalVideoUrl = rawVideoUrl; // Fallback
        }
      } else {
        console.warn('[FFMPEG-SKIP] Audio file not found. Skipping merge, using raw video.');
        finalVideoUrl = rawVideoUrl;
      }

      const dbScene = await prisma.videoScene.create({
        data: { 
          generationId, 
          sceneOrder: 1, 
          visualPrompt, 
          audioScript: totalAudioScript, 
          videoClipUrl: finalVideoUrl, 
          audioUrl 
        },
      });
      await prisma.videoGeneration.update({ where: { id: generationId }, data: { status: 'completed' } });
      return NextResponse.json({ success: true, results: [dbScene] });
    } else {
      throw new Error(`Runway SINGLE Task Failed: ${res.id}`);
    }
  } catch (error: any) {
    console.error('[API-CRITICAL]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
