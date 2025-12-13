import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { GasData, DiagnosisResult, Language } from "../types";

// Hàm parse JSON an toàn
const parseJSON = (text: string) => {
  try {
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("Failed to parse JSON", e);
    throw new Error("Invalid response format from AI");
  }
};

export const diagnoseTransformer = async (gasData: GasData, lang: Language): Promise<DiagnosisResult> => {
  // 1. LẤY API KEY CHUẨN VITE
  const apiKey = import.meta.env.VITE_API_KEY;
  
  if (!apiKey) {
    throw new Error("API Key not found in environment variables");
  }

  // 2. KHỞI TẠO SDK
  const genAI = new GoogleGenerativeAI(apiKey);

  // 3. CẤU HÌNH MODEL (Sử dụng 'gemini-1.5-flash-latest' để tránh lỗi 404)
  // Nếu vẫn lỗi, bạn hãy thử đổi dòng dưới thành "gemini-pro"
  const modelName = "gemini-1.5-flash-latest"; 
  
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2,
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          faultType: { type: SchemaType.STRING },
          confidence: { type: SchemaType.STRING },
          severity: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING },
          recommendation: { type: SchemaType.STRING },
          keyGasRatios: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                ratioName: { type: SchemaType.STRING },
                value: { type: SchemaType.NUMBER },
                interpretation: { type: SchemaType.STRING }
              },
              required: ["ratioName", "value", "interpretation"]
            }
          }
        },
        required: ["faultType", "confidence", "severity", "description", "recommendation", "keyGasRatios"]
      }
    }
  });

  const targetLanguage = lang === 'vi' ? 'Vietnamese' : 'English';

  const prompt = `
    Act as a Senior High Voltage Transformer Diagnostic Engineer.
    Analyze the following Dissolved Gas Analysis (DGA) data (in ppm) to predict the transformer fault type.
    
    Gas Concentrations:
    - Hydrogen (H2): ${gasData.H2} ppm
    - Methane (CH4): ${gasData.CH4} ppm
    - Ethane (C2H6): ${gasData.C2H6} ppm
    - Ethylene (C2H4): ${gasData.C2H4} ppm
    - Acetylene (C2H2): ${gasData.C2H2} ppm

    Possible Fault Types: Normal, Partial Discharge, Low Energy Discharge, High Energy Discharge, Mix Thermal & Discharge, Thermal Faults (T1, T2, T3).
    
    IMPORTANT: Provide the output in strict JSON format.
    Ensure 'description', 'recommendation', 'interpretation' and 'severity' are written in ${targetLanguage}.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    return parseJSON(response.text()) as DiagnosisResult;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    // Bắt lỗi 404 Model Not Found cụ thể để hướng dẫn sửa
    if (error.message && error.message.includes("404") && error.message.includes("not found")) {
        throw new Error(`Model '${modelName}' not found. Try changing model to 'gemini-pro' in geminiService.ts`);
    }
    
    throw error;
  }
};

export const searchStandards = async (query: string, lang: Language) => {
  const apiKey = import.meta.env.VITE_API_KEY;
  if (!apiKey) return null;

  const genAI = new GoogleGenerativeAI(apiKey);
  // Dùng model cơ bản cho search
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const langRequest = lang === 'vi' ? 'in Vietnamese' : 'in English';
  
  try {
    const result = await model.generateContent(
      `You are an expert in IEC/IEEE standards. User query: "${query}". 
      Summarize key limits or guidelines strictly based on standard transformer documents ${langRequest}.`
    );
    return {
      text: result.response.text(),
      chunks: [] 
    };
  } catch (error) {
    console.error("Search Error", error);
    return null;
  }
}
