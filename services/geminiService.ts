
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GasData, DiagnosisResult, Language } from "../types";

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
  //const apiKey = process.env.API_KEY;
  //if (!apiKey) {
  //  throw new Error("API Key not found");
  //}

  // 1. SỬA: Dùng import.meta.env cho Vite
  //const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
  
  //if (!apiKey) {
  //  throw new Error("API Key not found. Please check .env file or Vercel Settings.");
  //}
  
  const apiKey = getApiKey();
  // Kiểm tra cơ bản xem user đã thay key chưa
  if (!apiKey || apiKey === "AIzaSyABQg7OiicCs7ITFHinCoJtwn1HokhqN8o") {
    throw new Error("API_KEY_NOT_CONFIGURED");
  }
  
  const ai = new GoogleGenAI({ apiKey });  

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
    
    IMPORTANT: Provide the output in strict JSON format matching the schema.
    Ensure the content of 'description', 'recommendation', 'interpretation' and 'severity' is written in ${targetLanguage}.
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      faultType: { type: Type.STRING, description: "The predicted main fault type (Keep technical terms in English usually, or Vietnamese if common)." },
      confidence: { type: Type.STRING, description: "Confidence level: High, Medium, or Low." },
      severity: { type: Type.STRING, description: `Condition: Normal, Caution, or Critical (Translate to ${targetLanguage}).` },
      description: { type: Type.STRING, description: `A technical explanation of why this fault was chosen based on gas levels (in ${targetLanguage}).` },
      recommendation: { type: Type.STRING, description: `Actionable maintenance advice (in ${targetLanguage}).` },
      keyGasRatios: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            ratioName: { type: Type.STRING },
            value: { type: Type.NUMBER },
            interpretation: { type: Type.STRING, description: `Interpretation in ${targetLanguage}` }
          }
        }
      }
    },
    required: ["faultType", "confidence", "severity", "description", "recommendation", "keyGasRatios"]
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.2, // Low temperature for consistent analytical results
      }
    });

    return parseJSON(response.text || "{}") as DiagnosisResult;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const searchStandards = async (query: string, lang: Language) => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;

  const ai = new GoogleGenAI({ apiKey });
  const langRequest = lang === 'vi' ? 'in Vietnamese' : 'in English';
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Find the latest standards or guides regarding: ${query}. Summarize key limits briefly ${langRequest}.`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    return {
      text: response.text || "",
      chunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks
    };
  } catch (error) {
    console.error("Search Error", error);
    return null;
  }
}
