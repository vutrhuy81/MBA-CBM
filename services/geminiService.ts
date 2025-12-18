
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GasData, DiagnosisResult, Language } from "../types";

// Helper function to get API Key with priority: LocalStorage > Environment Variable
const getApiKey = (): string | undefined => {
  const localKey = localStorage.getItem('gemini_api_key');
  if (localKey && localKey.trim() !== '') {
    return localKey;
  }
  return import.meta.env.VITE_API_KEY; //process.env.API_KEY;
  
};

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
  const apiKey = getApiKey();
  
  if (!apiKey) {
    // Return a specific error that the UI can catch to prompt the user
    throw new Error("MISSING_API_KEY");
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
  const apiKey = getApiKey();
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
};

export const getExpertConsultation = async (
    gasData: GasData, 
    prediction: DiagnosisResult, 
    lang: Language,
    duvalTriangleZone: string,
    duvalPentagonZone: string
) => {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("MISSING_API_KEY");
  
    const ai = new GoogleGenAI({ apiKey });
    const targetLanguage = lang === 'vi' ? 'Vietnamese' : 'English';
  
    const prompt = `
      You are a Senior High Voltage Transformer Diagnostic Expert.
      
      A separate Machine Learning model (GBDT/FastTree) has analyzed the Dissolved Gas Analysis (DGA) data.
      
      --- INPUT DATA (ppm) ---
      H2: ${gasData.H2} | CH4: ${gasData.CH4} | C2H6: ${gasData.C2H6} | C2H4: ${gasData.C2H4} | C2H2: ${gasData.C2H2}
      
      --- DIAGNOSTIC RESULTS ---
      1. Machine Learning Model Prediction: ${prediction.faultType} (Confidence: ${prediction.confidence})
      2. Duval Triangle 1 Result: Zone ${duvalTriangleZone}
      3. Duval Pentagon 1 Result: Zone ${duvalPentagonZone}
  
      --- YOUR TASK ---
      Based on your expertise, provide a comprehensive evaluation in ${targetLanguage}.
      
      1. **Consistency Check**: specificially compare the Machine Learning prediction with the Duval Triangle 1 and Duval Pentagon 1 results. Do they agree? If there is a conflict, which one is likely more reliable based on the gas ratios?
      2. **Root Cause Analysis**: Provide a deep analysis of the likely physical phenomenon (e.g., overheating of oil, paper carbonization, high energy arcing) consistent with the provided gas data.
      3. **Actionable Recommendations**: Suggest 3 specific next steps (e.g., specific electrical tests like DCR, Turns Ratio, or sampling frequency).
      
      Format the response in Markdown with clear headings.
    `;
  
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
  
      return response.text;
    } catch (error) {
      console.error("Expert Consultation Error:", error);
      throw error;
    }
};
