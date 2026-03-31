import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('[V8-DEBUG] CONTENT REQUEST BODY:', { ...body, productImage: body.productImage ? 'BASE64_STUB' : 'null' });
    
    const { topic, tone, projectId, characterType, mainCharacter, locationContext, videoGenre, numScenes, productImage } = body;
    
    if (!topic || !projectId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Initialize New GenAI SDK (Google AI Studio Mode)
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        throw new Error('GOOGLE_API_KEY is not set in environment variables');
    }

    const ai = new GoogleGenAI({ apiKey });
    const modelId = 'gemini-2.5-flash'; 

    let promptParts: any[] = [];
    
    const sceneCountStr = String(numScenes || '2 cảnh');
    const sceneCount = parseInt(sceneCountStr.replace(/[^0-9]/g, '')) || 2;

    const basePrompt = `Bạn là một chuyên gia sáng tạo nội dung (Content Creator) và đạo diễn điện ảnh hàng đầu chuyên về mảng ẩm thực trên TikTok và TVC.
NHIỆM VỤ: Hãy tạo một kịch bản video cực kỳ lôi cuốn, có chiều sâu và ý nghĩa cho món ăn: "${topic}".

THÔNG TIN QUAN TRỌNG:
- Tổng số phân cảnh: ${sceneCount} cảnh. (Bắt buộc trả về đúng ${sceneCount} phân cảnh).
- Thể loại video: ${videoGenre || 'Giới thiệu món ăn'}. Hãy bám sát cấu trúc của thể loại này.
- Tone giọng: ${tone}.
- Bối cảnh: ${locationContext || 'Trong cửa hàng'}.
- Nhân vật chính: ${characterType} (${mainCharacter || 'Nam đầu bếp tận tâm'}). 
  LƯU Ý: AI Voice sẽ là giọng ${characterType}, hãy viết kịch bản phù hợp với giới tính này.

YÊU CẦU CẤU TRÚC JSON (BẮT BUỘC TRẢ VỀ ĐỐI TƯỢNG JSON):
{
  "fullAudioScript": "Lời thuyết minh chi tiết cho toàn bộ video (khoảng 30-40 từ, ý nghĩa).",
  "scenes": [
    {
      "sceneOrder": 1,
      "title": "Tên cảnh",
      "visualDescription": "Mô tả hình ảnh bằng tiếng Việt (chỉ mô tả những gì diễn ra, không thêm từ khóa kỹ thuật).",
      "technicalKeywords": "4k, photorealistic, cinematic lighting, high detailed material texture"
    },
    ... (đúng số cảnh ${sceneCount})
  ]
}

- Hành động: ${mainCharacter} đang làm gì cụ thể?

CHÚ Ý: Chỉ trả về JSON, không thêm văn bản khác.`;

    if (productImage && productImage.includes('base64,')) {
      const parts = productImage.split('base64,');
      const base64Data = parts[1];
      const mimeType = productImage.split(';')[0].split(':')[1];
      
      promptParts = [
        { text: basePrompt + `\n\nLƯU Ý ĐẶC BIỆT: Người dùng đã tải lên hình ảnh sản phẩm mẫu. 
1. Đầu tiên, hãy kiểm tra xem hình ảnh đó có phải là đồ ăn hoặc liên quan đến ẩm thực không. Nếu KHÔNG PHẢI đồ ăn, hãy thêm một thuộc tính "warning": "Ảnh không phải đồ ăn" vào JSON trả về, nhưng vẫn cố gắng tạo kịch bản dựa trên tên món ăn: ${topic}.
2. Nếu LÀ ĐỒ ĂN, hãy mô tả hình ảnh trong visualDescription sao cho bám sát các đặc điểm (màu sắc, hình dáng, cách bày trí) của ảnh mẫu đó.` },
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        }
      ];
    } else {
      promptParts = [{ text: basePrompt }];
    }

    console.log(`[V8-API-KEY] Calling Model: ${modelId} with Multimodal: ${!!productImage}`);

    // 2. Generate Content with basic retry for 503 High Demand
    let result: any;
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      try {
          result = await ai.models.generateContent({
            model: modelId,
            contents: [{ role: 'user', parts: promptParts }],
          });
          break; // Success!
      } catch (aiErr: any) {
          attempts++;
          // Nhận diện lỗi 503 hoặc quá tải
          const errString = JSON.stringify(aiErr);
          const isRetryable = errString.includes('503') || 
                              errString.toLowerCase().includes('high demand') || 
                              errString.includes('UNAVAILABLE');
          
          if (isRetryable && attempts < maxAttempts) {
            console.warn(`[GEMINI-RETRY] 503/High Demand. Attempt ${attempts}/${maxAttempts}...`);
            await new Promise(r => setTimeout(r, 4000)); // Đợi 4s
            continue;
          }

          console.error('[V8-DEBUG] AI GENERATION FAILED:', aiErr);
          
          // --- GRACEFUL FALLBACK ---
          if (aiErr.message?.includes('Unable to process input image') || aiErr.message?.includes('400')) {
            console.warn('[V8-DEBUG] AI rejected image. Falling back to text-only generation.');
            try {
              result = await ai.models.generateContent({
                model: modelId,
                contents: [{ role: 'user', parts: [{ text: basePrompt }] }],
              });
              result.__forced_warning = "AI Studio không thể xử lý ảnh này. Đã tạo kịch bản dựa trên văn bản.";
              break;
            } catch (retryErr: any) {
              throw new Error(`AI Retry Error: ${retryErr.message}`);
            }
          } else {
            throw new Error(`AI Studio Error: ${aiErr.message || 'Unknown AI error'}`);
          }
      }
    }

    const candidate = result.candidates?.[0];
    const part = candidate?.content?.parts?.[0];
    const contentText = part?.text || '';
    console.log('[V8-DEBUG] RAW GENAI RESPONSE:', contentText);

    if (!contentText) {
        throw new Error('AI trả về kết quả rỗng. Vui lòng thử lại.');
    }

    const jsonString = contentText.replace(/```json/g, '').replace(/```/g, '').trim();
    let scenes = [];
    let warning = null;
    
    try {
        const parsed = JSON.parse(jsonString);
        if (parsed.scenes && Array.isArray(parsed.scenes)) {
          scenes = parsed.scenes;
          // Carry over properties for immediate return
          (scenes as any).fullAudioScript = parsed.fullAudioScript || '';
          warning = parsed.warning;
        } else {
          scenes = Array.isArray(parsed) ? parsed : [parsed];
        }
    } catch (parseError) {
        console.log('[V8-DEBUG] JSON Parse failed, trying regex extraction...');
        const arrayMatch = jsonString.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
            scenes = JSON.parse(arrayMatch[0]);
        } else {
            throw new Error('Không thể parse kịch bản từ Gemini: ' + contentText.substring(0, 50));
        }
    }
    
    if (!Array.isArray(scenes) || scenes.length === 0) {
        throw new Error('Kịch bản rỗng. Hãy thử lại với chủ đề khác.');
    }

    // 2. Ensure Project Exists
    console.log('[V8-DEBUG] Verifying Project:', projectId);
    const existingProject = await prisma.videoProject.findUnique({ where: { id: projectId } });
    if (!existingProject) {
      console.log('[V8-DEBUG] Creating dummy user/project for:', projectId);
      await prisma.user.upsert({
        where: { id: projectId },
        update: {},
        create: { id: projectId, email: `test_${projectId}@foodiegen.com`, fullName: 'Test Component', passwordHash: 'dummy' }
      });
      await prisma.videoProject.create({
        data: { id: projectId, userId: projectId, title: 'Auto-Generated Test Project', status: 'draft' }
      });
    }

    // 3. Save to Database
    console.log('[V8-DEBUG] Saving script to DB...');
    const script = await prisma.videoScript.create({
      data: {
        projectId,
        content: {
          scenes,
          fullAudioScript: (scenes as any).fullAudioScript || ''
        },
        version: 1,
        isActive: true,
      },
    });

    console.log('[V8-DEBUG] SUCCESS. Script ID:', script.id);
    return NextResponse.json({ 
      projectId,
      scriptId: script.id, 
      scenes, 
      fullAudioScript: (scenes as any).fullAudioScript || '',
      warning: warning || result.__forced_warning 
    });
  } catch (error: any) {
    console.error('[V8-CRITICAL] API Error:', error);
    return NextResponse.json({ error: error.message || 'Lỗi hệ thống không xác định' }, { status: 500 });
  }
}
