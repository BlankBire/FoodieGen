import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import RunwayML from '@runwayml/sdk';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import { CHARACTERS, VOICES } from '../../../../lib/constants';

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

async function generateAudioTask(
  totalAudioScript: string,
  config: any,
  finalScriptId: string,
  audioDir: string,
  audioFilePath: string
) {
  if (!totalAudioScript.trim()) return '';

  const fptVoice = config?.voiceGender || 'leminh';
  console.log(`[FPT-AI] [TASK] Generating TTS with Voice ID: ${fptVoice}...`);
  const fptApiKey = process.env.FPT_AI_API_KEY;
  const fptSpeed = Math.floor(((config?.voiceSpeed || 50) / 100) * 6) - 2;
  
  try {
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
    if (fptData.async && fptData.error === 0) {
      const asyncUrl = fptData.async;
      let audioBuffer: Buffer | null = null;
      
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 2000));
        try {
          const checkRes = await fetch(asyncUrl);
          if (checkRes.ok && checkRes.headers.get('content-type')?.includes('audio')) {
            audioBuffer = Buffer.from(await checkRes.arrayBuffer());
            break;
          }
        } catch (e) {}
      }
      
      if (audioBuffer) {
        const rawAudioPath = path.join(audioDir, `raw_fpt_${finalScriptId}.mp3`);
        fs.writeFileSync(rawAudioPath, audioBuffer);
        
        try {
          const { execSync } = require('child_process');
          const ffmpegPath = path.join(process.cwd(), 'bin', 'ffmpeg.exe');
          execSync(`"${ffmpegPath}" -y -i "${rawAudioPath}" -f lavfi -t 1 -i anullsrc=r=44100:cl=stereo -filter_complex "[0:a]aresample=44100[a0];[1:a]aresample=44100[a1];[a0][a1]concat=n=2:v=0:a=1" "${audioFilePath}"`);
          if (fs.existsSync(rawAudioPath)) fs.unlinkSync(rawAudioPath);
          return `/audio/fpt_${finalScriptId}.mp3`;
        } catch (padErr) {
          console.error(`[FPT-AI-PAD-ERROR]`, padErr);
          fs.writeFileSync(audioFilePath, audioBuffer);
          return `/audio/fpt_${finalScriptId}.mp3`;
        }
      }
    }
  } catch (err: any) {
    console.error(`[FPT-AI-TASK-CRITICAL]`, err.message);
  }
  return '';
}

async function generateVideoTask(
  runway: RunwayML,
  visualPrompt: string,
  ratio: string,
  duration: number
) {
  const MODELS_PRIORITY = ['gen4.5', 'gen3a_turbo', 'veo3.1_fast', 'veo3.1', 'veo3'];
  let res: { id: string } | null = null;
  let lastErr: any = null;
  
  for (const mid of MODELS_PRIORITY) {
    try {
      console.log(`[RUNWAY] [TASK] Model: ${mid} | Duration: ${duration}s | Request Sent...`);
      res = await (runway.textToVideo as any).create({
        model: mid,
        promptText: visualPrompt,
        ratio,
        duration: duration, 
      });
      if (res) break;
    } catch (e: any) {
      lastErr = e;
      console.warn(`[RUNWAY-TASK] ${mid} failed:`, e?.message || e);
    }
  }

  if (!res) throw lastErr || new Error('Runway generation failed');

  let task = await runway.tasks.retrieve(res.id);
  while (task.status !== 'SUCCEEDED' && task.status !== 'FAILED') {
    await new Promise(r => setTimeout(r, 5000)); // Optimized to 5s
    task = await runway.tasks.retrieve(res.id);
  }

  if (task.status === 'SUCCEEDED') {
    return (task as any).output?.[0] || '';
  }
  throw new Error(`Runway task failed: ${task.status}`);
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
      script = await prisma.videoScript.findUnique({ 
        where: { id: finalScriptId },
        include: { project: true }
      });
    }

    let scenes: any[] = [];
    let fullAudioScript = '';
    const defaultProjectId = '123e4567-e89b-12d3-a456-426614174000';

    if (manualScript && manualScript.trim()) {
       scenes = await refineManualScript(manualScript, googleApiKey || '');
       const newScript = await prisma.videoScript.create({
         data: {
             project: { connect: { id: script?.projectId || defaultProjectId } },
             content: { scenes } as any
         }
       });
       script = newScript;
       finalScriptId = newScript.id;
    } else if (script) {
       const content = script.content as any;
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

    const configData = (script?.content as any)?.config || {};
    const characterId = configData.characterId || '';
    const characterType = configData.characterType || '';
    const mainCharacter = configData.mainCharacter || 'chef';
    
    // --- SOURCE OF TRUTH: Lookup gender from CHARACTERS constant ---
    const charDefinition = CHARACTERS.find((c: any) => c.id === characterId);
    const resolvedGender = charDefinition?.gender || characterType; 
    const genderInEng = resolvedGender === 'Nam' ? 'Male' : (resolvedGender === 'Nữ' ? 'Female' : '');

    const projectTopic = script?.project?.storyTopic || script?.project?.title || 'Delicious Food';
    const targetDur = parseInt(String(config?.duration || '10').replace(/[^0-9]/g, '')) || 10;
    const duration = targetDur;
    
    const combinedVisualPrompt = scenes.map(s => {
      const desc = s.visualDescription || '';
      const kw = s.technicalKeywords || '';
      return `${desc} ${kw}`.trim();
    }).join(' [TRANSITION] ').substring(0, 1000); 

    const visualPrompt = [
      `A ${duration}-second cinematic 4k video about ${projectTopic}.`,
      combinedVisualPrompt,
      `Character Focus: A ${genderInEng} ${mainCharacter}, smiling, speaking directly to camera, vibrant facial expressions.`,
      `Identical to product image, high shape preservation, perfect symmetry, detailed surface texture, realistic textures.`,
      `Cinematic camera motion, smooth panning, slow zoom, professional camera tracking, dynamic sweeping shots.`,
      `Style: ${config?.activeStyle || 'cinematic'}.`,
      `Vivid colors, cinematic lighting, material texture, sharp focus on the dish and the person.`,
      `NO smoke, NO noise, high motion but stable professional camera.`
    ].filter(Boolean).join(' ').slice(0, 1000);

    const ratio = config?.aspectRatio === '16:9' ? '1280:720' : '720:1280';
    const audioFileName = `fpt_${finalScriptId}.mp3`;
    const audioFilePath = path.join(audioDir, audioFileName);
    let audioUrl = '';

    // --- PARALLEL EXECUTION: AUDIO & VIDEO ---
    console.log('[PIPELINE] Starting Parallel Generation...');
    
    const [audioResultUrl, rawVideoUrl] = await Promise.all([
      generateAudioTask(totalAudioScript, config, finalScriptId, audioDir, audioFilePath),
      generateVideoTask(runway, visualPrompt, ratio, duration)
    ]);

    audioUrl = audioResultUrl;

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
          
          execSync(`"${ffmpegPath}" -y -i "${tempVideoPath}" -i "${audioFilePath}" -filter_complex "[1:a]apad[aout]" -map 0:v:0 -map "[aout]" -c:v copy -c:a aac -shortest "${finalVideoPath}"`);
          
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
  } catch (error: any) {
    console.error('[API-CRITICAL]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
