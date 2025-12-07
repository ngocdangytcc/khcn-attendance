// src/services/geminiService.ts
// So khớp khuôn mặt bằng Gemini (gemini-2.5-flash)

import { GoogleGenerativeAI } from "@google/generative-ai";

export interface FaceVerificationResponse {
  isMatch: boolean;
  confidence: number;
  reasoning: string;
}

function getApiKey(): string {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error(
      "❌ Không tìm thấy API_KEY. Kiểm tra Vercel → Settings → Environment Variables."
    );
    throw new Error("API Key not found");
  }
  return apiKey;
}

/** Đọc model từ ENV, mặc định là gemini-2.5-flash */
function getModelId(): string {
  return process.env.GEMINI_MODEL_ID || "gemini-2.5-flash";
}

export async function verifyFace(
  referenceImageBase64: string,
  currentImageBase64: string
): Promise<FaceVerificationResponse> {
  try {
    const apiKey = getApiKey();
    const modelId = getModelId();

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelId });

    // Loại bỏ phần header "data:image/...;base64,"
    const cleanRef = referenceImageBase64.replace(
      /^data:image\/(png|jpeg|jpg|webp);base64,/,
      ""
    );
    const cleanCurr = currentImageBase64.replace(
      /^data:image\/(png|jpeg|jpg|webp);base64,/,
      ""
    );

    const prompt = `
      You are a strict biometric verification system.
      Compare the face in the FIRST image (Reference)
      with the face in the SECOND image (Live Capture).

      Focus on stable facial features (shape of the face, eyes, nose, mouth,
      distances between features). Ignore minor differences such as lighting,
      glasses, or hairstyle.

      Respond with a SINGLE JSON object ONLY, no extra text:
      {
        "isMatch": true or false,
        "confidence": number between 0 and 1,
        "reasoning": "short explanation in Vietnamese"
      }
    `;

    // 👉 Cấu trúc đúng cho SDK mới, responseMimeType nằm trong generationConfig
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: cleanRef,
              },
            },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: cleanCurr,
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const response = await result.response;
    let text = response.text();

    // Phòng trường hợp Gemini trả về trong ```json ... ```
    text = text.replace(/```json/gi, "").replace(/```/g, "").trim();

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      console.error("❌ Không parse được JSON từ Gemini:", text, err);
      return {
        isMatch: false,
        confidence: 0,
        reasoning:
          "Lỗi xử lý kết quả từ Gemini (phản hồi không phải JSON hợp lệ).",
      };
    }

    return {
      isMatch: !!parsed.isMatch,
      confidence:
        typeof parsed.confidence === "number" ? parsed.confidence : 0,
      reasoning:
        typeof parsed.reasoning === "string"
          ? parsed.reasoning
          : "Gemini không cung cấp giải thích rõ ràng.",
    };
  } catch (error) {
    console.error("❌ Gemini Verification Error:", error);
    return {
      isMatch: false,
      confidence: 0,
      reasoning: "Lỗi xử lý nội bộ hoặc API không phản hồi.",
    };
  }
}
