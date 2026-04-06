import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('[V8-DEBUG] CONTENT REQUEST BODY:', { ...body, productImage: body.productImage ? 'BASE64_STUB' : 'null' });
    
    const { topic, tone, projectId, characterId, characterType, mainCharacter, locationContext, videoGenre, numScenes, productImage } = body;
    
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

    const durationRaw = String(body.duration || '10').replace(/[^0-9]/g, '');
    const durationNum = parseInt(durationRaw) || 10;
    const voiceDuration = durationNum - 1; // Mục tiêu kết thúc trước 1s
    const maxWords = Math.floor(voiceDuration * 2); // Siết chặt 2 từ/giây để đảm bảo an toàn

    console.log(`[V8-DEBUG] Target Video: ${durationNum}s | Target Audio: ${voiceDuration}s | Max Words: ${maxWords}`);

    const basePrompt = `Bạn là một đạo diễn ẩm thực tài ba.
NHIỆM VỤ: Tạo nội dung video cho món ăn: "${topic}".

QUY TẮC PHÂN TÍCH HÌNH ẢNH (CỰC KỲ CHI TIẾT):
- Bạn hãy soi cực kỹ ảnh mẫu (productImage) được tải lên.
- Phải xác định rõ HÌNH DẠNG HÌNH HỌC (Vd: Hình tròn hoàn hảo, Hình vuông sắc cạnh, Hình Oval).
- Phải mô tả HOA VĂN/HỌA TIẾT đặc trưng trên bề mặt (Vd: họa tiết truyền thống, hoa văn in nổi, vỏ bánh chín vàng bóng bẩy).
- Các đặc điểm này PHẢI được đưa vào technicalKeywords để ép Runway giữ đúng "Thần thái" và "Hình dáng" của sản phẩm gốc, không được để sản phẩm bị biến dạng.

QUY CÁCH NHÂN VẬT & BỐI CẢNH:
- Nhân vật chính: Giới tính ${characterType}. Mô tả: ${mainCharacter}.
- Bối cảnh: ${locationContext}.
- Thể loại video: ${videoGenre}.

QUY TẮC BẮT BUỘC VỀ THỜI LƯỢNG (SIÊU CÔ ĐỌNG):
- Lời thoại (fullAudioScript) PHẢI CỰC KỲ DỨT KHOÁT, ĐẾM KỸ TỪ: TUYỆT ĐỐI KHÔNG ĐƯỢC VƯỢT QUÁ ${maxWords} TỪ. Nếu vượt quá, video sẽ bị hỏng hiệu ứng.
- Mục tiêu: Tất cả lời thoại phải được đọc hết nhanh chóng trong ${voiceDuration} giây (để dư 1-2 giây im lặng chuyên nghiệp ở cuối).
- Kịch bản này là DUY NHẤT và sẽ được dùng chung cho mọi kiểu giọng đọc (Bắc/Trung/Nam), nên hãy dùng ngôn ngữ phổ thông, dứt khoát.
- CHỈ TRẢ VỀ JSON, KHÔNG trả về văn bản dẫn chuyện.
- Phần visualDescription: Viết lời mô tả hình ảnh CHUYÊN NGHIỆP nhưng THÂN THIỆN, dễ hiểu với người dùng (Tiếng Việt). Luôn bao gồm mô tả về chuyển động của máy quay (VD: "Máy quay từ từ tiến lại gần...", "Lia máy nhẹ nhàng từ trái sang phải...").
- Phần technicalKeywords: Chứa các từ khóa tiếng Anh chuyên môn để AI tạo video (Runway) đạt hiệu quả cao nhất (Vd: cinematic, 4k, slow zoom in, smooth pan, camera sliding, tracking shot, shallow depth of field).

QUY TẮC PHÂN CẢNH (CỰC KỲ QUAN TRỌNG):
- Cảnh 1 (Scene 1): LUÔN PHẢI bắt đầu bằng hình ảnh cận cảnh nhân vật chính. Nhân vật phải đang mỉm cười, cử động môi tự nhiên (lip-sync) như đang nói chuyện trực tiếp với camera. Thời lượng cảnh 1 chiếm khoảng 30% video.
- Các cảnh sau: Thực hiện lia máy (pan), trượt (sliding) hoặc thu phóng (zoom) mượt mà chuyển từ nhân vật sang đặc tả vẻ đẹp của món ăn chính.
- Biểu cảm: Luôn bao gồm các từ khóa biểu cảm vào technicalKeywords (Vd: lip-syncing, talking to camera, smiling, expressive facial movements).
- Tuyệt đối không để góc quay tĩnh đứng yên.
- Luân phiên giữa các góc quay: Close-up (Cận cảnh), Macro (Siêu cận), Cinematic tracking.
- Chuyển động camera phải mượt mà và tập trung vào vẻ đẹp của món ăn và nhân vật chính.
{
  "fullAudioScript": "Lời thoại dài khoảng ${maxWords} từ. Viết theo phong cách nhân vật đang NÓI CHUYỆN trực tiếp.",
  "scenes": [
    {
      "sceneOrder": 1,
      "title": "Tên cảnh",
      "visualDescription": "Mô tả hình ảnh (Tiếng Việt). Nhấn mạnh hành động của nhân vật và đặc điểm món ăn.",
      "technicalKeywords": "Từ khóa kỹ thuật (Tiếng Anh). Bao gồm: 4k, photorealistic, cinematic lighting, high detailed material texture, mouth movement, lip sync."
    },
    ... (đúng số cảnh ${sceneCount})
  ]
}

CHÚ Ý: Hãy đảm bảo nhân vật (Giới tính ${characterType}) có hành động và biểu cảm phù hợp với món ăn.`;

    if (productImage && productImage.includes('base64,')) {
      const parts = productImage.split('base64,');
      const base64Data = parts[1];
      const mimeType = productImage.split(';')[0].split(':')[1];
      
      promptParts = [
        { text: basePrompt + `\n\nLƯU Ý ĐẶC BIỆT (PHÂN TÍCH ẢNH THẬT): Người dùng đã tải lên hình ảnh sản phẩm mẫu. 
1. Đầu tiên, hãy kiểm tra xem hình ảnh đó có phải là đồ ăn không. Nếu KHÔNG PHẢI đồ ăn, thêm "warning": "Ảnh không phải đồ ăn" vào JSON.
2. Nếu LÀ ĐỒ ĂN: Hãy phân tích CỰC KỲ CHI TIẾT các yếu tố sau và đưa vào visualDescription của TẤT CẢ các cảnh:
   - Hình dạng hình học chính xác (Vd: bánh hình tròn hoản hảo, hình trụ, hình cầu...). Tuyệt đối giữ đúng hình dạng này (Vd: tròn thì không được tả thành oval). Càng giống ảnh mẫu càng tốt.
   - Chi tiết bề mặt: Các hoa văn chạm khắc trên bánh, logo, độ bóng của vỏ, các lớp nhân.
   - Màu sắc: Tông màu chủ đạo chính xác của ảnh mẫu.
3. Đảm bảo nhân vật chính trong kịch bản (${mainCharacter}) tương tác hoặc giới thiệu món ăn này sao cho bám sát các đặc điểm thật đã phân tích được.` },
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
          fullAudioScript: (scenes as any).fullAudioScript || '',
          config: { characterId, characterType, mainCharacter, locationContext, videoGenre }
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
