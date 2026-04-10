import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

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
    const modelId = 'gemini-3.1-flash-lite-preview'; 

    let promptParts: any[] = [];
    
    const sceneCountStr = String(numScenes || '2 cảnh');
    const sceneCount = parseInt(sceneCountStr.replace(/[^0-9]/g, '')) || 2;

    const durationRaw = String(body.duration || '10').replace(/[^0-9]/g, '');
    const durationNum = parseInt(durationRaw) || 10;
    const voiceDuration = durationNum - 1; // Mục tiêu kết thúc trước 1s
    const maxWords = Math.floor(voiceDuration * 2.2); 

    console.log(`[V8-DEBUG] Target Video: ${durationNum}s | Target Audio: ${voiceDuration}s | Max Words: ${maxWords}`);

    // --- SAVE PRODUCT IMAGE IF EXISTS ---
    let savedProductImageUrl = '';
    if (productImage && productImage.includes('base64,')) {
      try {
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        
        const base64Data = productImage.split('base64,')[1];
        const ext = productImage.split(';')[0].split('/')[1] || 'png';
        const fileName = `prod_${Date.now()}.${ext}`;
        const filePath = path.join(uploadDir, fileName);
        
        fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
        savedProductImageUrl = `/uploads/products/${fileName}`;
        console.log('[V8-DEBUG] Product image saved:', savedProductImageUrl);
      } catch (err) {
        console.error('[V8-DEBUG] Failed to save product image:', err);
      }
    }

    const basePrompt = `Bạn là một đạo diễn ẩm thực và điện ảnh chuyên nghiệp.
NHIỆM VỤ: Tạo nội dung video kịch bản chất lượng cao cho món ăn: "${topic}".

QUY TẮC PHÂN TÍCH HÌNH ẢNH (Image-to-Video Focus):
- Giữ nguyên hình ảnh 100%: Món ăn TUYỆT ĐỐI KHÔNG ĐƯỢC biến dạng (No deformation), không "tan chảy", không thay đổi hoa văn so với ảnh mẫu.
- Xác định HÌNH DẠNG HÌNH HỌC (tròn, vuông, khối) và HOA VĂN đặc trưng trên bề mặt để AI Runway tái hiện chính xác nhất.
- Mô tả chi tiết kết cấu (texture): độ bóng của vỏ, lớp nhân. Chỉ cho phép hiệu ứng ánh sáng hoặc hơi gió/khói cực nhẹ trên bề mặt để đảm bảo sản phẩm đứng yên vững chãi (Static product).
- Ánh sáng: Đặc tả hướng sáng (vd: side lighting, rim lighting) để làm nổi bật các cạnh của sản phẩm.
- Camera: Luôn bắt đầu bằng các chuyển động camera mượt mà như "Slow macro tracking", "Gentle push-in" hoặc "Circular orbit".

QUY CÁCH NHÂN VẬT & BỐI CẢNH (Text-to-Video Focus):
- Nhân vật: Giới tính ${characterType}. Mô tả: ${mainCharacter}. 
  + Phải mô tả chi tiết: Ánh mắt rạng rỡ chuyển động linh hoạt, nụ cười tỏa nắng, làn da chân thực (realistic skin texture), biểu cảm khuôn mặt sống động (micro-expressions), gật đầu nhẹ nhàng đầy thân thiện.
  + Hành động: Cử động môi (lip-sync) khớp lời thoại, cử chỉ tay tự nhiên và đa dạng (Vd: mời khách, chỉ vào món ăn, hoặc thực hiện các thao tác bếp nhẹ nhàng đầy điêu luyện).
- Bối cảnh: ${locationContext}. Phải mô tả không gian có chiều sâu (depth), ánh sáng môi trường ấm cúng, phông nền mờ ảo.

QUY TẮC PHÂN BỔ THỜI LƯỢNG (40/60 RULE):
- Tổng video dài ${durationNum} giây, chia làm ${sceneCount} cảnh.
- Thời lượng cảnh MÓN ĂN (Product Focus): Phải chiếm khoảng 60% tổng thời gian.
- Thời lượng cảnh NHÂN VẬT (Character Focus): Phải chiếm khoảng 40% tổng thời gian.

QUY TẮC PHÂN CẢNH (YÊU CẦU CHÍNH XÁC ${sceneCount} CẢNH):
- Cảnh 1 (Product Focus): Camera Macro quay cận cảnh món ăn bám sát ảnh mẫu 100%. Ánh sáng soft studio lighting, tập trung vào chi tiết tinh xảo nhất.
- Các cảnh tiếp theo: Lia máy mượt mà để chuyển đổi từ Món ăn sang Nhân vật. Nhân vật xuất hiện trong bối cảnh ${locationContext} sang trọng, giới thiệu món ăn với phong thái chuyên gia.

QUY TẮC BẮT BUỘC VỀ THỜI LƯỢNG LỜI THOẠI:
- Lời thoại (fullAudioScript): TUYỆT ĐỐI KHÔNG ĐƯỢC ngắn hơn 20 từ và không vượt quá ${maxWords} TỪ.
- Phong cách: Viết kịch bản kiểu Marketing đầy cảm xúc, có vần điệu, nhịp điệu tiếng Việt bay bổng, tránh viết ngang hoặc liệt kê sự thật khô khan.
- Mục tiêu: Hoàn tất lời thoại trong ${voiceDuration} giây một cách thong thả, truyền cảm.

QUY CÁCH TRẢ VỀ:
- CHỈ TRẢ VỀ JSON. Danh sách "scenes" phải có ĐÚNG ${sceneCount} phần tử.
- visualDescription: MIÊU TẢ CỐT TRUYỆN (Storytelling). Dùng tiếng Việt tự nhiên, giàu sức gợi để người dùng đọc cảm thấy hứng thú. Tuyệt đối KHÔNG chứa các từ khóa kỹ thuật như "Macro", "Panning", "Lip-sync", "Adherence", "Zoom".
- technicalKeywords: TỪ KHÓA KỸ THUẬT (AI Instructions). Chuyên dùng cho Runway ML. Bao gồm: Camera movement (Macro, Slow tracking, Panning), Animation details (Lip-sync, perfect skin, 100% subject adherence, zero motion on product, realistic textures), Quality keywords (4k, cinematic lighting, shallow depth of field).
- isProductFocus: Thêm trường boolean này vào mỗi cảnh (true nếu cảnh đó tập trung vào món ăn).

{
  "fullAudioScript": "Lời thoại bay bổng, có vần điệu, giàu cảm xúc Marketing (đạt từ 20 đến ${maxWords} từ)...",
  "scenes": [
    {
      "sceneOrder": 1,
      "title": "...",
      "isProductFocus": true,
      "visualDescription": "Mô tả một cách gợi cảm hứng bằng tiếng Việt về món ăn... (Không dùng thuật ngữ camera)",
      "technicalKeywords": "macro, slow tracking, 100% subject adherence, zero motion on product, 4k"
    },
    "... (tổng cộng ${sceneCount} cảnh) ..."
  ]
}

CHÚ Ý: Visual Description phải viết như kể một câu chuyện mượt mà, gợi hình, hoàn toàn bằng tiếng Việt.
CHÚ Ý: Toàn bộ thuật ngữ tiếng Anh, tỷ lệ % trung thực (Adherence) và các ghi chú về khớp môi (Lip-sync) TUYỆT ĐỐI PHẢI nằm trong field technicalKeywords để AI xử lý ngầm, không show lên cho người dùng.`;

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
          config: { characterId, characterType, mainCharacter, locationContext, videoGenre, savedProductImageUrl }
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
