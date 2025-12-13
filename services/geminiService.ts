import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { GasData, DiagnosisResult, Language } from "../types";

// Hàm parse JSON an toàn (giữ nguyên logic của bạn)
const parseJSON = (text: string) => {
  try {
    // Remove markdown code blocks if present
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("Failed to parse JSON", e);
    throw new Error("Invalid response format from AI");
  }
};

export const diagnoseTransformer = async (gasData: GasData, lang: Language): Promise<DiagnosisResult> => {
  // 1. QUAN TRỌNG: Sử dụng import.meta.env cho Vite
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
  
  if (!apiKey) {
    console.error("API Key is missing. Please check .env file or Vercel Environment Variables.");
    throw new Error("API Key not found");
  }

  // 2. Khởi tạo SDK chuẩn cho React
  const genAI = new GoogleGenerativeAI(apiKey);

  const targetLanguage = lang === 'vi' ? 'Vietnamese' : 'English';

  // 3. Cấu hình Model và Schema
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash", // Dùng model ổn định nhất hiện tại
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2,
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          faultType: { 
            type: SchemaType.STRING, 
            description: "The predicted main fault type (Keep technical terms in English usually, or Vietnamese if common)." 
          },
          confidence: { 
            type: SchemaType.STRING, 
            description: "Confidence level: High, Medium, or Low." 
          },
          severity: { 
            type: SchemaType.STRING, 
            description: `Condition: Normal, Caution, or Critical (Translate to ${targetLanguage}).` 
          },
          description: { 
            type: SchemaType.STRING, 
            description: `A technical explanation of why this fault was chosen based on gas levels (in ${targetLanguage}).` 
          },
          recommendation: { 
            type: SchemaType.STRING, 
            description: `Actionable maintenance advice (in ${targetLanguage}).` 
          },
          keyGasRatios: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                ratioName: { type: SchemaType.STRING },
                value: { type: SchemaType.NUMBER },
                interpretation: { type: SchemaType.STRING, description: `Interpretation in ${targetLanguage}` }
              },
              required: ["ratioName", "value", "interpretation"]
            }
          }
        },
        required: ["faultType", "confidence", "severity", "description", "recommendation", "keyGasRatios"]
      }
    }
  });

  const prompt = `
    Act as a Senior High Voltage Transformer Diagnostic Engineer.
    Analyze the following Dissolved Gas Analysis (DGA) data (in ppm) to predict the transformer fault type.
    
    Gas Concentrations:
    - Hydrogen (H2): ${gasData.H2} ppm
    - Methane (CH4): ${gasData.CH4} ppm
    - Ethane (C2H6): ${gasData.C2H6} ppm
    - Ethylene (C2H4): ${gasData.C2H4} ppm
    - Acetylene (C2H2): ${gasData.C2H2} ppm

    Use standard methods like Rogers Ratio, IEC 60599, or Duval Triangle logic to determine the fault.
    
    Possible Fault Types to consider:
    - Normal
    - Partial Discharge (Corona)
    - Low Energy Discharge (Sparking)
    - High Energy Discharge (Arcing)
    - Mix Thermal & Discharge
    - Thermal Fault < 300°C
    - Thermal Fault 300°C - 700°C
    - Thermal Fault > 700°C
    
    IMPORTANT: Provide the output in strict JSON format matching the schema provided in configuration.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    return parseJSON(response.text()) as DiagnosisResult;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

// Hàm search giữ nguyên logic nhưng cập nhật cách gọi API
export const searchStandards = async (query: string, lang: Language) => {
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
  if (!apiKey) return null;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  const langRequest = lang === 'vi' ? 'in Vietnamese' : 'in English';
  
  try {
    // Lưu ý: SDK Client-side hiện tại chưa hỗ trợ Google Search Tool một cách trực tiếp dễ dàng như bản server
    // Nên ta dùng prompt kỹ thuật để giả lập tra cứu kiến thức
    const result = await model.generateContent(
      `You are an expert in IEC/IEEE standards. User query: "${query}". 
      Summarize key limits or guidelines strictly based on standard transformer documents ${langRequest}.`
    );

    return {
      text: result.response.text() || "",
      chunks: [] 
    };
  } catch (error) {
    console.error("Search Error", error);
    return null;
  }
}
