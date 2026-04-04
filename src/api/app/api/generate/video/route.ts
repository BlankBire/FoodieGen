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

    // --- CONSOLIDATION FOR COST SAVING (CHẾ ĐỘ CHẮT CHIU) ---
    // --- TRÍ TUYỆT ĐỐI: CHẾ ĐỘ CHÍN MUỒI (Bám sát kịch bản) ---
    const totalAudioScript = (fullAudioScript && fullAudioScript.trim()) 
      ? fullAudioScript 
      : scenes.map((s: any) => s.audioScript).filter(Boolean).join('... ');

    console.log(`[DEBUG-AUDIO] FINAL TEXT TO READ: "${totalAudioScript}"`);

    const combinedVisualPrompt = scenes.map(s => {
      const desc = s.visualDescription || '';
      const kw = s.technicalKeywords || '';
      return `${desc} ${kw}`.trim();
    }).join(' [TRANSITION] ').substring(0, 1000); 

    let audioUrl = '';
    const audioFileName = `fpt_${finalScriptId}.mp3`;
    const audioFilePath = path.join(audioDir, audioFileName);

    if (totalAudioScript.trim()) {
      console.log(`[FPT-AI] Generating TTS with Voice: ${config?.voiceGender === 'Nữ' ? 'Ban Mai' : 'Lê Minh'}...`);
      const fptApiKey = process.env.FPT_AI_API_KEY;
      const fptVoice = config?.voiceGender === 'Nữ' ? 'banmai' : 'leminh';
      const fptSpeed = Math.floor(((config?.voiceSpeed || 50) / 100) * 6) - 3;
      
      try {
        // --- FIX CHỐT HẠ: Đúng giao thức FPT.AI v5 ---
        // Tham số đưa lên Headers, Body chỉ chứa văn bản thô (Raw Text)
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
          console.log(`[FPT-AI] Async URL received: ${asyncUrl}. Waiting for file...`);
          
          // Polling mechanism (Max 60s)
          let audioBuffer: Buffer | null = null;
          console.log(`[FPT-AI] Start polling for audio file...`);
          for (let i = 0; i < 30; i++) {
            await new Promise(r => setTimeout(r, 2000));
            try {
              const checkRes = await fetch(asyncUrl);
              // Kiểm tra kỹ Content-Type để đảm bảo file đã "chín"
              if (checkRes.ok && checkRes.headers.get('content-type')?.includes('audio')) {
                audioBuffer = Buffer.from(await checkRes.arrayBuffer());
                break;
              }
              process.stdout.write('.'); 
            } catch (e) {
              // Not ready yet
            }
          }
          console.log(''); 
          
          if (audioBuffer) {
            const rawAudioPath = path.join(audioDir, `raw_${audioFileName}`);
            fs.writeFileSync(rawAudioPath, audioBuffer);
            
            // --- FFmpeg SILENCE PADDING (Add 1s at the end) ---
            try {
              console.log(`[FFMPEG] Adding 1s silence padding to audio...`);
              const { execSync } = require('child_process');
              const ffmpegPath = path.join(process.cwd(), 'bin', 'ffmpeg.exe');
              // Lệnh này nối thêm 1 giây im lặng và chuẩn hóa về 44.1k stereo
              execSync(`"${ffmpegPath}" -y -i "${rawAudioPath}" -f lavfi -t 1 -i anullsrc=r=44100:cl=stereo -filter_complex "[0:a]aresample=44100[a0];[1:a]aresample=44100[a1];[a0][a1]concat=n=2:v=0:a=1" "${audioFilePath}"`);
              
              audioUrl = `/audio/${audioFileName}`;
              console.log(`[FFMPEG] Audio padding success.`);
              if (fs.existsSync(rawAudioPath)) fs.unlinkSync(rawAudioPath);
            } catch (padErr) {
              console.error(`[FFMPEG-PAD-ERROR] Failed to add silence, using raw audio:`, padErr);
              fs.writeFileSync(audioFilePath, audioBuffer); // Fallback to raw
              audioUrl = `/audio/${audioFileName}`;
            }
          } else {
            console.error(`[FPT-AI] Polling timeout (60s).`);
          }
        } else {
          console.error(`[FPT-AI] API Error: ${fptData.message || 'Unknown'}`);
        }
      } catch (err: any) {
        console.error(`[FPT-AI-CRITICAL] Network error: ${err.message}`);
      }
    }

    // --- RUNWAY CONFIGURATION (UPGRADED) ---
    const targetDur = parseInt(String(config?.duration || '10').replace(/[^0-9]/g, '')) || 10;
    let modelId = 'gen3a_turbo'; 
    let duration = targetDur;
    
    const MODELS_PRIORITY = ['gen4.5', 'gen3a_turbo', 'veo3.1_fast', 'veo3.1', 'veo3'];
    const projectTopic = script?.project?.storyTopic || script?.project?.title || 'Delicious Food';

    // Xây dựng prompt chi tiết với hiệu ứng Lip Sync & Cinematic
    const visualPrompt = [
      `A ${duration}-second cinematic 4k video about ${projectTopic}.`,
      combinedVisualPrompt,
      `Main Character: ${script?.project?.mainCharacter || 'chef'} speaking directly to the camera, vibrant facial expressions.`,
      `Mouth movement, lip sync, speaking naturally, friendly interaction.`,
      `Style: ${config?.activeStyle || 'cinematic'}.`,
      `Vivid colors, cinematic lighting, material texture, sharp focus on the dish and the person.`,
      `NO smoke, NO noise, high motion but stable camera.`
    ].filter(Boolean).join(' ').slice(0, 1000);
    
    const ratio = config?.aspectRatio === '16:9' ? '1280:720' : '720:1280';

    console.log(`[RUNWAY] Target: ${duration}S with Model Priority...`);
    let res: { id: string } | null = null;
    let lastErr: any = null;
    
    for (const mid of MODELS_PRIORITY) {
      try {
        console.log(`[RUNWAY] Attempting Model: ${mid} with Duration: ${duration}s`);
        
        res = await (runway.textToVideo as any).create({
          model: mid,
          promptText: visualPrompt,
          ratio,
          duration: duration, 
        });
        if (res) {
          modelId = mid;
          break;
        }
      } catch (e: any) {
        lastErr = e;
        console.warn(`[RUNWAY] ${mid} failed:`, e?.message || e);
        continue;
      }
    }

    if (!res) throw lastErr || new Error('Không có model Runway nào khả dụng (vui lòng kiểm tra Credits/Hạng tài khoản)');

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
