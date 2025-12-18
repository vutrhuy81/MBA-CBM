
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { GasData, DiagnosisResult, Language, HealthIndexResult } from "../types";

/**
 * Diagnoses transformer fault using Gemini AI.
 */
export const diagnoseTransformer = async (gasData: GasData, lang: Language): Promise<DiagnosisResult> => {
  // Fix: Initializing GoogleGenAI inside the function as per best practices for key management.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const targetLanguage = lang === 'vi' ? 'Vietnamese' : 'English';
  const prompt = `
    Act as a Senior High Voltage Transformer Diagnostic Engineer.
    Analyze the following DGA data (in ppm):
    - H2: ${gasData.H2}, CH4: ${gasData.CH4}, C2H6: ${gasData.C2H6}, C2H4: ${gasData.C2H4}, C2H2: ${gasData.C2H2}
    - CO: ${gasData.CO}, CO2: ${gasData.CO2}

    Use standard methods like Rogers Ratio, IEC 60599, and Duval Triangle logic.
    Respond in ${targetLanguage}.
    Provide the output in strict JSON format.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      // Fix: Simplified contents format to use direct string input.
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            faultType: { type: Type.STRING },
            confidence: { type: Type.STRING },
            severity: { type: Type.STRING },
            description: { type: Type.STRING },
            recommendation: { type: Type.STRING },
            keyGasRatios: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  ratioName: { type: Type.STRING },
                  value: { type: Type.NUMBER },
                  interpretation: { type: Type.STRING }
                },
                required: ["ratioName", "value", "interpretation"]
              }
            }
          },
          required: ["faultType", "confidence", "severity", "description", "recommendation", "keyGasRatios"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    return JSON.parse(text) as DiagnosisResult;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

/**
 * Gets expert consultation for diagnosis results.
 */
export const getExpertConsultation = async (
    gasData: GasData, 
    prediction: DiagnosisResult, 
    lang: Language,
    duvalTriangleZone: string,
    duvalPentagonZone: string
) => {
    // Fix: Initializing GoogleGenAI inside the function as per best practices.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Evaluate transformer health. Gas: H2:${gasData.H2} CH4:${gasData.CH4} C2H6:${gasData.C2H6} C2H4:${gasData.C2H4} C2H2:${gasData.C2H2}. Model Pred: ${prediction.faultType}. Duval T1: ${duvalTriangleZone}. Duval P1: ${duvalPentagonZone}. Language: ${lang}. Provide technical insights.`;
    const response: GenerateContentResponse = await ai.models.generateContent({ 
      model: 'gemini-3-pro-preview', 
      // Fix: Simplified contents format.
      contents: prompt
    });
    return response.text;
};

/**
 * EXPERT HEALTH INDEX CONSULTATION
 * Uses Gemini 3 Pro to evaluate DGAF, LEDTF, PIF indices.
 */
export const getHealthIndexConsultation = async (result: HealthIndexResult, lang: Language) => {
  // Fix: Initializing GoogleGenAI inside the function as per best practices.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    Bạn là một Chuyên gia Cao cấp về Quản lý Vận hành và Chẩn đoán Máy biến áp (MBA) truyền tải 110kV-500kV.
    Dựa trên kết quả tính toán Health Index (HI) GBDT sau đây, hãy cung cấp một bản phân tích kỹ thuật chuyên sâu và các đề xuất bảo trì:

     THÔNG SỐ SỨC KHỎE MBA:
    - Health Index Tổng hợp (Final HI): ${result.finalHI}% (Tình trạng: ${result.condition})
    - Chỉ số DGA (DGAF): ${result.DGAF}
    - Chỉ số Phóng điện/Nhiệt (LEDTF): ${result.LEDTF}
    - Chỉ số Cách điện giấy (PIF): ${result.PIF} (Phân rã Cellulose: PIF1=${result.PIF1}, PIF2=${result.PIF2})
    - Kết quả Dự đoán GBDT: ${result.gbdtFault}
    - Tổng khí cháy (TDCG): ${result.TDCG} ppm
    - Tỷ số CO2/CO: ${result.CO2_CO_Ratio}

    YÊU CẦU PHÂN TÍCH:
    1. Đánh giá rủi ro: Kết luận về mức độ tin cậy vận hành hiện tại. Có nguy cơ sự cố đột xuất không?
    2. Giải thích các chỉ số then chốt: 
       - LEDTF cho thấy gì về rủi ro phóng điện hoặc quá nhiệt trong dầu?
       - PIF và tỷ số CO2/CO phản ánh tình trạng lão hóa giấy cách điện Cellulose như thế nào?
    3. Chiến lược bảo trì: Đưa ra 4-5 hành động cụ thể (ví dụ: Tần suất lấy mẫu khí, thí nghiệm điện FDS/PDC, kiểm tra bộ đổi nấc dưới tải OLTC, lọc dầu hay thay thế giấy cách điện).
    
    Phản hồi bằng tiếng ${lang === 'vi' ? 'Việt' : 'Anh'} theo phong cách báo cáo chuyên gia kỹ thuật, sử dụng định dạng Markdown (Dùng ### cho tiêu đề phần).
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({ 
      model: 'gemini-3-pro-preview', 
      // Fix: Simplified contents format.
      contents: prompt
    });
    return response.text;
  } catch (error) {
    console.error("Health Index Consultation Error:", error);
    throw error;
  }
};

/**
 * Searches for standards using Google Search grounding.
 */
export const searchStandards = async (query: string, lang: Language) => {
  // Fix: Initializing GoogleGenAI inside the function as per best practices.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      // Fix: Simplified contents format.
      contents: `Search transformer industry standards for: ${query}. Language: ${lang}`,
      config: { tools: [{ googleSearch: {} }] }
    });
    return { 
      text: response.text || "", 
      chunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks 
    };
  } catch (e) { 
    console.error("Search Grounding Error:", e);
    return null; 
  }
};
