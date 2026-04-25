import { NextResponse } from "next/server";
// Debug import marker to surface module load-time errors in production logs
console.log("[TRACE] Loaded route: /api/generate/content");
import prisma from "../../../../lib/prisma";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";

const DEBUG_LOG = path.join(process.cwd(), "foodiegen-debug.log");
function appendDebug(...args: any[]) {
  try {
    const line =
      `[${new Date().toISOString()}] ` +
      args
        .map((a) => {
          try {
            return typeof a === "string" ? a : JSON.stringify(a);
          } catch (e) {
            return String(a);
          }
        })
        .join(" ") +
      "\n";
    fs.appendFileSync(DEBUG_LOG, line);
  } catch (e) {
    // ignore
  }
}

export async function POST(req: Request) {
  try {
    console.log(
      "[TRACE] POST /api/generate/content invoked. Headers:",
      Object.fromEntries(req.headers),
    );
    appendDebug("TRACE POST invoked", {
      headers: Object.fromEntries(req.headers),
    });
    const body = await req.json();
    console.log("[V8-DEBUG] CONTENT REQUEST BODY:", {
      ...body,
      productImage: body.productImage ? "BASE64_STUB" : "null",
    });

    const {
      topic,
      tone,
      projectId,
      characterId,
      characterType,
      mainCharacter,
      locationContext,
      videoGenre,
      numScenes,
      productImage,
      duration: durationInput,
      emotion,
      activeStyle,
    } = body;

    if (!topic || !projectId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // 1. Initialize New GenAI SDK (Google AI Studio Mode)
    const headerApiKey = req.headers.get("x-google-api-key");
    const apiKey = headerApiKey;

    if (!apiKey) {
      throw new Error(
        "Vui lòng nhập Google Gemini API Key trong phần Cài đặt của bạn.",
      );
    }

    const ai = new GoogleGenAI({ apiKey, apiVersion: "v1beta" });
    const modelId = "gemini-3.1-flash-lite-preview";

    let promptParts: any[] = [];

    const isMarketingMode = !!body.isMarketingMode;
    const referenceDoc = body.referenceDoc || "";
    
    const sceneCountStr = String(numScenes || "2 cảnh");
    let sceneCount = parseInt(sceneCountStr.replace(/[^0-9]/g, "")) || 2;
    
    // Nếu là chế độ Marketing, ép số cảnh lên 7 để đảm bảo thời lượng 60-90s
    if (isMarketingMode) {
      sceneCount = 7;
    }

    const durationStr = String(durationInput || body.duration || "10");
    let durationNum = 10;
    // Support custom:XX format from frontend
    const customDurMatch = durationStr.match(/^custom:(\d+)$/);
    if (customDurMatch) {
      durationNum = parseInt(customDurMatch[1]) || 10;
    } else if (durationStr.includes('m')) {
      durationNum = parseInt(durationStr) * 60;
    } else {
      durationNum = parseInt(durationStr.replace(/[^0-9]/g, "")) || 10;
    }
    
    // Nếu là chế độ Marketing, thời lượng mục tiêu là 60-90s
    if (isMarketingMode) {
      durationNum = 75; // Trung bình 75s
    }

    const voiceDuration = durationNum - 1; 
    const maxWords = Math.floor(voiceDuration * 2.5);

    console.log(
      `[V8-DEBUG] Mode: ${isMarketingMode ? 'MARKETING' : 'CREATIVE'} | Target Video: ${durationNum}s | Max Words: ${maxWords}`,
    );

    // --- SAVE PRODUCT IMAGE IF EXISTS ---
    let savedProductImageUrl = "";
    if (productImage && productImage.includes("base64,")) {
      try {
        const uploadDir = path.join(
          process.cwd(),
          "public",
          "uploads",
          "products",
        );
        if (!fs.existsSync(uploadDir))
          fs.mkdirSync(uploadDir, { recursive: true });

        const base64Data = productImage.split("base64,")[1];
        const ext = productImage.split(";")[0].split("/")[1] || "png";
        const fileName = `prod_${Date.now()}.${ext}`;
        const filePath = path.join(uploadDir, fileName);

        fs.writeFileSync(filePath, Buffer.from(base64Data, "base64"));
        savedProductImageUrl = `/uploads/products/${fileName}`;
        console.log("[V8-DEBUG] Product image saved:", savedProductImageUrl);
      } catch (err) {
        console.error("[V8-DEBUG] Failed to save product image:", err);
      }
    }

    let basePrompt = "";
    
    if (isMarketingMode) {
      basePrompt = `Bạn là chuyên gia Marketing Video và Biên kịch quảng cáo chuyên nghiệp.
NHIỆM VỤ: Chuyển đổi nội dung tài liệu sau đây thành một kịch bản video Marketing đỉnh cao: "${referenceDoc}".

YÊU CẦU CẤU TRÚC KỊCH BẢN (60-90 GIÂY):
1. HOOK (3 giây đầu): Phải cực kỳ gây tò mò, đánh vào nỗi đau hoặc khát khao của khách hàng để họ không lướt qua.
2. NỘI DUNG CHÍNH (Body): Trình bày các giá trị cốt lõi, lợi ích của sản phẩm/món ăn một cách mạch lạc, chia thành từng phân đoạn ngắn gọn, súc tích.
3. CTA (Call to Action): Kết thúc bằng một lời kêu gọi hành động mạnh mẽ, rõ ràng (Vd: Mua ngay, Ghé quán ngay, Inbox để nhận ưu đãi).

QUY TẮC PHÂN CẢNH (YÊU CẦU CHÍNH XÁC ${sceneCount} CẢNH):
- Các cảnh phải có sự tiếp nối logic. 
- Sử dụng nhân vật (${mainCharacter}) làm người dẫn dắt (Host) xuyên suốt.
- Đặc tả hành động nhân vật: Đang nói chuyện nhiệt huyết (active talking), sử dụng ngôn ngữ cơ thể, tương tác với sản phẩm.

QUY TẮC LỜI THOẠI:
- Lời thoại (fullAudioScript): Phải dài từ 150 đến ${maxWords} từ để đảm bảo thời lượng 60-90s.
- Ngôn ngữ: Tự nhiên, thuyết phục, đậm chất quảng cáo truyền cảm hứng.

TOKEN TRẢ VỀ (JSON ONLY):
{
  "fullNaturalLanguageScript": "[Cảnh 1: ...] Lời thoại... [Cảnh 2: ...] Lời thoại...",
  "fullAudioScript": "Mẫu lời thoại chỉ chứa text để TTS...",
  "scenes": [
    {
      "sceneOrder": 1,
      "title": "HOOK: [Tên tiêu đề]",
      "isProductFocus": true,
      "visualDescription": "Miêu tả cảnh quay...",
      "technicalKeywords": "camera move, active mouth movement, cinematic lighting, 4k"
    },
    "... (đủ ${sceneCount} cảnh) ..."
  ]
}
`;
    } else {
      basePrompt = `Bạn là một đạo diễn ẩm thực và điện ảnh chuyên nghiệp.
NHIỆM VỤ: Tạo nội dung video kịch bản chất lượng cao cho món ăn: "${topic}".

QUY TẮC PHÂN TÍCH HÌNH ẢNH (Image-to-Video Focus):
- Giữ nguyên hình ảnh 100%: Món ăn TUYỆT ĐỐI KHÔNG ĐƯỢC biến dạng (No deformation), không "tan chảy", không thay đổi hoa văn so với ảnh mẫu.
- Xác định HÌNH DẠNG HÌNH HỌC (tròn, vuông, khối) và HOA VĂN đặc trưng trên bề mặt để AI Runway tái hiện chính xác nhất.
- Mô tả chi tiết kết cấu (texture): độ bóng của vỏ, lớp nhân. Chỉ cho phép hiệu ứng ánh sáng hoặc hơi gió/khói cực nhẹ trên bề mặt để đảm bảo sản phẩm đứng yên vững chãi (Static product).
- Ánh sáng: Đặc tả hướng sáng (vd: side lighting, rim lighting) để làm nổi bật các cạnh của sản phẩm.
- Camera: Video PHẢI bắt đầu bằng Macro quay món ăn (Product Focus) trong khoảng 40% thời lượng đầu, sau đó BẮT BUỘC thực hiện chuyển động lia máy (pan/tilt) hoặc zoom out mượt mà để tiết lộ nhân vật (Character Reveal) đang đứng giới thiệu món ăn.
- Luôn đảm bảo cả món ăn và nhân vật cùng xuất hiện hài hòa trong cùng một không gian vật lý, không tách rời.

QUY CÁCH NHÂN VẬT & BỐI CẢNH (Text-to-Video Focus):
- Nhân vật: Giới tính ${characterType}. Mô tả: ${mainCharacter}. 
  + QUY TẮC PERSONA (Custom Character Handling): Nếu đây là nhân vật tùy chỉnh (không theo mẫu có sẵn), AI phải thực hiện: 
    1. Tự đặt một "Tên Vai Diễn" ngắn gọn dựa trên mô tả (Vd: "Võ sư", "Bà lão", "Phi hành gia").
    2. Trích xuất CỰC KỲ CHI TIẾT diện mạo: Độ tuổi, trang phục (màu sắc, chất liệu), phụ kiện (kính, mũ), và thần thái (vui vẻ, uy nghiêm).
    3. Sử dụng "Tên Vai Diễn" và các đặc điểm ngoại hình này một cách nhất quán (Logical Consistency) trong TẤT CẢ các phân cảnh.
  + Đặc tả khuôn mặt & Hành động: Nhân vật PHẢI đang thực hiện hành động NÓI (speaking/introducing) một cách tự nhiên và nhiệt huyết. Ánh mắt rạng rỡ chuyển động linh hoạt, làn da chân thực (realistic skin texture), biểu cảm khuôn mặt sống động (micro-expressions), cử động miệng (active jaw movement, visible speech) khớp lời thoại, cử chỉ tay tự nhiên khi giới thiệu sản phẩm. TUYỆT ĐỐI KHÔNG để nhân vật chỉ đứng cười mỉm môi.
- Bối cảnh: ${locationContext}. Phải mô tả không gian có chiều sâu (depth), ánh sáng môi trường ấm cúng, phông nền mờ ảo.

QUY TẮC PHÂN BỔ THỜI LƯỢNG (40/60 RULE):
- Tổng video dài ${durationNum} giây, chia làm ${sceneCount} cảnh.
- Thời lượng cảnh MÓN ĂN (Product Focus): Phải chiếm khoảng 60% tổng thời gian.
- Thời lượng cảnh NHÂN VẬT (Character Focus): Phải chiếm khoảng 40% tổng thời gian.

QUY TẮC PHÂN CẢNH (YÊU CẦU CHÍNH XÁC ${sceneCount} CẢNH):
- Cảnh 1 (Product Focus): Camera Macro quay cận cảnh món ăn bám sát ảnh mẫu 100% (No deformation). Ánh sáng soft studio lighting, tập trung vào chi tiết tinh xảo.
- Các cảnh tiếp theo: TUYỆT ĐỐI PHẢI lia máy mượt mà để tiết lộ nhân vật chính (${mainCharacter}) đang giới thiệu món ăn. Nhân vật xuất hiện trong bối cảnh ${locationContext}, nói chuyện tự nhiên (active talking persona) và giới thiệu món bánh trung thu một cách mời chào.

QUY TẮC BẮT BUỘC VỀ THỜI LƯỢNG LỜI THOẠI:
- Lời thoại (fullAudioScript): TUYỆT ĐỐI KHÔNG ĐƯỢC ngắn hơn 20 từ và không vượt quá ${maxWords} TỪ.
- Phong cách: Viết kịch bản kiểu Marketing đầy cảm xúc, có vần điệu, nhịp điệu tiếng Việt bay bổng, tránh viết ngang hoặc liệt kê sự thật khô khan.
- Nhấn mạnh THƯƠNG HIỆU: Luôn lồng ghép TÊN THƯƠNG HIỆU hoặc LOGO (nếu phát hiện được từ ảnh) vào lời thoại một cách trang trọng, tự hào và đầy cảm xúc. Đây là yếu tố sống còn của video quảng cáo.
- Mục tiêu: Hoàn tất lời thoại trong ${voiceDuration} giây một cách thong thả, truyền cảm.

QUY CÁCH TRẢ VỀ:
- CHỈ TRẢ VỀ JSON. Danh sách "scenes" phải có ĐÚNG ${sceneCount} phần tử.
- visualDescription: MIÊU TẢ CỐT TRUYỆN (Storytelling). Dùng tiếng Việt tự nhiên, giàu sức gợi để người dùng đọc cảm thấy hứng thú. Tuyệt đối KHÔNG chứa các từ khóa kỹ thuật như "Macro", "Panning", "Lip-sync", "Adherence", "Zoom".
- technicalKeywords: TỪ KHÓA KỸ THUẬT (AI Instructions). Chuyên dùng cho Runway ML. Bao gồm: Camera sequence (Macro start then smooth pan to reveal character), Animation details (Active mouth movement, speaking naturally, high adherence to source image, locked product geometry, rigid object consistency), Quality keywords (4k, cinematic lighting, shallow depth of field).
- isProductFocus: Thêm trường boolean này vào mỗi cảnh (true nếu cảnh đó tập trung vào món ăn).

{
  "fullNaturalLanguageScript": "BẮT BUỘC: Viết kịch bản theo phong cách kể chuyện (Storytelling) dài và chi tiết. Cấu trúc phải là: [Cảnh 1: Mô tả bối cảnh, hành động nhân vật một cách giàu hình ảnh] + Lời thoại Marketing tương ứng. [Cảnh 2: ...] + Lời thoại... Tiếp tục cho đến hết ${sceneCount} cảnh. Tuyệt đối không dùng thuật ngữ kỹ thuật ở đây.",
  "fullAudioScript": "Lời thoại Marketing thuần túy để đọc (Voice-over) cho toàn bộ video, đạt từ 20 đến ${maxWords} từ...",
  "scenes": [
    {
      "sceneOrder": 1,
      "title": "...",
      "isProductFocus": true,
      "visualDescription": "Mô tả một cách gợi cảm hứng bằng tiếng Việt về món ăn... (Không dùng thuật ngữ camera)",
      "technicalKeywords": "macro, slow tracking, 100% subject adherence, zero motion on product, 4k"
    }
    "... (tổng cộng ${sceneCount} cảnh) ..."
  ]
}

QUY TẮC VỀ ĐỘ DÀI:
- Bản fullNaturalLanguageScript phải giàu tính gợi hình, độ dài tối thiểu 100 từ.
- Mỗi phân cảnh PHẢI bắt đầu bằng thẻ [Cảnh X] trong văn bản.
`;
    }

    // Inject custom genre, emotion, style into prompt
    const genreNote = videoGenre ? `\nTHỂ LOẠI VIDEO: ${videoGenre}. Kịch bản phải phù hợp với thể loại này.` : '';
    const emotionNote = emotion ? `\nCẢM XÚC CHỦ ĐẠO: ${emotion}. Toàn bộ kịch bản phải toát lên cảm xúc "${emotion}" — từ lời thoại, mô tả hình ảnh đến nhịp điệu kể chuyện.` : '';
    const styleNote = activeStyle ? `\nPHONG CÁCH HÌNH ẢNH: ${activeStyle}. Mô tả hình ảnh trong mỗi phân cảnh phải mang phong cách "${activeStyle}".` : '';
    basePrompt += genreNote + emotionNote + styleNote;

    basePrompt += `
CHÚ Ý: Visual Description phải viết như kể một câu chuyện mượt mà, gợi hình, hoàn toàn bằng tiếng Việt.
CHÚ Ý: Toàn bộ thuật ngữ tiếng Anh, tỷ lệ % trung thực (Adherence) và các ghi chú về khớp môi (Lip-sync) TUYỆT ĐỐI PHẢI nằm trong field technicalKeywords để AI xử lý ngầm, không show lên cho người dùng.

ADDITIONAL RULE: Strict invitation/conclusion phrasing
Ensure the final invitation sentence (kết thúc lời thoại) is a professional,
grammatically complete Vietnamese sentence (subject + predicate).
Example of the required style: "Mời mọi người cùng [Thương hiệu] thưởng thức...".
Do NOT end with fragments, colloquial ellipses, or imperative fragments lacking a subject.
The invitation must reference the brand when available and be polite, complete, and marketing-appropriate.`;

    if (productImage && productImage.includes("base64,")) {
      const parts = productImage.split("base64,");
      const base64Data = parts[1];
      const mimeType = productImage.split(";")[0].split(":")[1];

      promptParts = [
        {
          text:
            basePrompt +
            `\n\nLƯU Ý ĐẶC BIỆT (PHÂN TÍCH ẢNH THẬT): Người dùng đã tải lên hình ảnh sản phẩm mẫu. 
1. Đầu tiên, hãy kiểm tra xem hình ảnh đó có phải là đồ ăn không. Nếu KHÔNG PHẢI đồ ăn, thêm "warning": "Ảnh không phải đồ ăn" vào JSON.
2. Nếu LÀ ĐỒ ĂN: Hãy phân tích CỰC KỲ CHI TIẾT các yếu tố sau và đưa vào visualDescription của TẤT CẢ các cảnh:
   - Hình dạng hình học chính xác (Vd: bánh hình tròn hoản hảo, hình trụ, hình cầu...). Tuyệt đối giữ đúng hình dạng này (Vd: tròn thì không được tả thành oval). Càng giống ảnh mẫu càng tốt.
   - Nhận diện THƯƠNG HIỆU: Tìm kiếm TÊN THƯƠNG HIỆU, LOGO hoặc các ký tự được chạm khắc/in trên bề mặt món ăn (đặc biệt là trên bánh trung thu).
   - Chi tiết bề mặt: Các hoa văn chạm khắc, độ bóng của vỏ, các lớp nhân.
   - Màu sắc: Tông màu chủ đạo chính xác của ảnh mẫu.
3. QUY TẮC LỜI THOẠI (BRAND-HEAVY): Nếu phát hiện ra tên thương hiệu hoặc logo, bạn phải đưa tên thương hiệu đó vào "fullAudioScript" một cách tự nhiên nhưng nổi bật (Vd: "Thưởng thức vị ngon từ [Tên thương hiệu]...").
4. Đảm bảo nhân vật chính trong kịch bản (${mainCharacter}) tương tác hoặc giới thiệu món ăn này sao cho bám sát các đặc điểm thật đã phân tích được.
`,
        },
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        },
      ];
    } else {
      promptParts = [{ text: basePrompt }];
    }

    console.log(
      `[V8-API-KEY] Calling Model: ${modelId} with Multimodal: ${!!productImage}`,
    );

    // 2. Generate Content with basic retry for 503 High Demand
    let result: any;
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      try {
        result = await ai.models.generateContent({
          model: modelId,
          contents: [{ role: "user", parts: promptParts }],
        });
        break; // Success!
      } catch (aiErr: any) {
        attempts++;
        // Nhận diện lỗi 503 hoặc quá tải
        const errString = JSON.stringify(aiErr);
        const isRetryable =
          errString.includes("503") ||
          errString.toLowerCase().includes("high demand") ||
          errString.includes("UNAVAILABLE");

        if (isRetryable && attempts < maxAttempts) {
          console.warn(
            `[GEMINI-RETRY] 503/High Demand. Attempt ${attempts}/${maxAttempts}...`,
          );
          await new Promise((r) => setTimeout(r, 4000)); // Đợi 4s
          continue;
        }

        console.error("[V8-DEBUG] AI GENERATION FAILED:", aiErr);

        // --- GRACEFUL FALLBACK ---
        if (
          aiErr.message?.includes("Unable to process input image") ||
          aiErr.message?.includes("400")
        ) {
          console.warn(
            "[V8-DEBUG] AI rejected image. Falling back to text-only generation.",
          );
          try {
            result = await ai.models.generateContent({
              model: modelId,
              contents: [{ role: "user", parts: [{ text: basePrompt }] }],
            });
            result.__forced_warning =
              "AI Studio không thể xử lý ảnh này. Đã tạo kịch bản dựa trên văn bản.";
            break;
          } catch (retryErr: any) {
            throw new Error(`AI Retry Error: ${retryErr.message}`);
          }
        } else {
          throw new Error(
            `AI Studio Error: ${aiErr.message || "Unknown AI error"}`,
          );
        }
      }
    }

    const candidate = result.candidates?.[0];
    const part = candidate?.content?.parts?.[0];
    const contentText = part?.text || "";
    console.log("[V8-DEBUG] RAW GENAI RESPONSE:", contentText);

    if (!contentText) {
      throw new Error("AI trả về kết quả rỗng. Vui lòng thử lại.");
    }

    const jsonString = contentText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    let scenes = [];
    let warning = null;
    let fullAudioScript = "";
    let fullNaturalLanguageScript = "";

    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.scenes && Array.isArray(parsed.scenes)) {
        scenes = parsed.scenes;
        fullAudioScript = parsed.fullAudioScript || "";
        fullNaturalLanguageScript = parsed.fullNaturalLanguageScript || "";
        warning = parsed.warning;
      } else {
        scenes = Array.isArray(parsed) ? parsed : [parsed];
      }
    } catch (parseError) {
      console.log("[V8-DEBUG] JSON Parse failed, trying regex extraction...");
      const arrayMatch = jsonString.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        scenes = JSON.parse(arrayMatch[0]);
      } else {
        throw new Error(
          "Không thể parse kịch bản từ Gemini: " + contentText.substring(0, 50),
        );
      }
    }

    if (!Array.isArray(scenes) || scenes.length === 0) {
      throw new Error("Kịch bản rỗng. Hãy thử lại với chủ đề khác.");
    }

    // 2. Ensure Project Exists
    console.log("[V8-DEBUG] Verifying Project:", projectId);
    const existingProject = await prisma.videoProject.findUnique({
      where: { id: projectId },
    });
    if (!existingProject) {
      console.log("[V8-DEBUG] Creating dummy user/project for:", projectId);
      await prisma.user.upsert({
        where: { id: projectId },
        update: {},
        create: {
          id: projectId,
          email: `test_${projectId}@foodiegen.com`,
          fullName: "Test Component",
          passwordHash: "dummy",
        },
      });
      await prisma.videoProject.create({
        data: {
          id: projectId,
          userId: projectId,
          title: "Auto-Generated Test Project",
          status: "draft",
        },
      });
    }

    // 3. Save to Database
    console.log("[V8-DEBUG] Saving script to DB...");
    const script = await prisma.videoScript.create({
      data: {
        projectId,
        content: JSON.stringify({
          scenes,
          fullAudioScript,
          fullNaturalLanguageScript,
          config: {
            characterId,
            characterType,
            mainCharacter,
            locationContext,
            videoGenre,
            savedProductImageUrl,
          },
        }),
        version: 1,
        isActive: true,
      },
    });

    console.log("[V8-DEBUG] SUCCESS. Script ID:", script.id);
    return NextResponse.json({
      projectId,
      scriptId: script.id,
      scenes,
      fullAudioScript,
      fullNaturalLanguageScript: fullNaturalLanguageScript || fullAudioScript,
      warning: warning || (result as any)?.__forced_warning,
    });
  } catch (error: any) {
    console.error("[V8-CRITICAL] API Error:", error);
    return NextResponse.json(
      {
        error: error.message || "Lỗi hệ thống không xác định",
        details: error.stack,
        code: error.code,
      },
      { status: 500 },
    );
  }
}
