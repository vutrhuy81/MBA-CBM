import { GasData, DiagnosisResult, Language, ModelType } from "../types";

// --- GBDT Interfaces ---
interface FastApiResponse {
  ket_qua_loi: string;
  do_tin_cay: string;
  chi_tiet_xac_suat: number[];
}

// --- FastTreeOva Interfaces ---
interface CPCLoginResponse {
  teN_DNHAP: string;
  mA_DVI: string;
  token: string;
}

interface CPCPredictResponse {
  h2: number;
  cH4: number;
  c2H6: number;
  c2H4: number;
  c2H2: number;
  type: number;
  features: number[];
  predictedLabel: string;
  score: number[];
}

// ⚠️ QUAN TRỌNG: Thứ tự này BẮT BUỘC phải giống y hệt biến LABELS trong Python (GBDT)
const MODEL_LABELS_ORDER = ["DT", "T1", "T3", "N", "D2", "T2", "PD", "D1"];

const FAULT_MAPPING: Record<string, { 
    type: { en: string; vi: string }; 
    severity: "Normal" | "Caution" | "Critical"; 
    desc: { en: string; vi: string } 
}> = {
  "N": { 
    type: { en: "Normal", vi: "Bình thường" },
    severity: "Normal", 
    desc: { en: "Transformer condition appears normal.", vi: "Tình trạng máy biến áp có vẻ bình thường." }
  },
  "PD": { 
    type: { en: "Partial Discharge", vi: "Phóng điện cục bộ" },
    severity: "Caution", 
    desc: { en: "Low energy discharges (Corona) detected.", vi: "Phát hiện phóng điện năng lượng thấp (Corona)." }
  },
  "D1": { 
    type: { en: "Low Energy Discharge", vi: "Phóng điện năng lượng thấp" },
    severity: "Caution", 
    desc: { en: "Discharges of low energy (Sparking) detected.", vi: "Phát hiện phóng điện năng lượng thấp (Tia lửa điện)." }
  },
  "D2": { 
    type: { en: "High Energy Discharge", vi: "Phóng điện năng lượng cao" },
    severity: "Critical", 
    desc: { en: "Discharges of high energy (Arcing) detected. Immediate attention recommended.", vi: "Phát hiện phóng điện năng lượng cao (Hồ quang). Cần chú ý ngay lập tức." }
  },
  "T1": { 
    type: { en: "Thermal Fault < 300°C", vi: "Lỗi nhiệt < 300°C" },
    severity: "Caution", 
    desc: { en: "Low range thermal fault detected.", vi: "Phát hiện lỗi nhiệt độ thấp." }
  },
  "T2": { 
    type: { en: "Thermal Fault 300-700°C", vi: "Lỗi nhiệt 300-700°C" },
    severity: "Caution", 
    desc: { en: "Medium range thermal fault detected.", vi: "Phát hiện lỗi nhiệt độ trung bình." }
  },
  "T3": { 
    type: { en: "Thermal Fault > 700°C", vi: "Lỗi nhiệt > 700°C" },
    severity: "Critical", 
    desc: { en: "High range thermal fault detected. Risk of insulation degradation.", vi: "Phát hiện lỗi nhiệt độ cao. Nguy cơ suy giảm cách điện." }
  },
  "DT": { 
    type: { en: "Mix Thermal & Discharge", vi: "Hỗn hợp Nhiệt & Phóng điện" },
    severity: "Critical", 
    desc: { en: "Combined thermal and electrical fault detected. Complex failure mode.", vi: "Phát hiện lỗi kết hợp nhiệt và điện. Chế độ lỗi phức tạp." }
  },
};

// --- CẤU HÌNH PROXY ---
const PROXY_HOST = "https://api.powertransformer.vn";

const loginFastTree = async (): Promise<string> => {
  const LOGIN_URL = `${PROXY_HOST}/proxy/login`;
  
  const body = {
    username: "admin",
    passWord: "Admin@#2024", 
    ip: ""
  };

  const response = await fetch(LOGIN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
     console.error("Login Failed Status:", response.status);
     throw new Error("Failed to login to CPC API via Proxy");
  }
  const data: CPCLoginResponse = await response.json();
  return data.token;
};

/**
 * Kiểm tra xem các khí có vượt ngưỡng cảnh báo sớm hay không.
 */
const isAboveThreshold = (gas: GasData): boolean => {
    return (
        gas.H2 > 50 || 
        gas.CH4 > 30 || 
        gas.C2H6 > 20 || 
        gas.C2H4 > 60 || 
        gas.C2H2 > 0 || 
        gas.CO > 400 || 
        gas.CO2 > 3800
    );
};

// --- CHỈ GIỮ LẠI MỘT HÀM EXPORT DUY NHẤT Ở ĐÂY ---
export const diagnoseWithProposedModel = async (
  gasData: GasData, 
  lang: Language,
  modelType: ModelType = 'gbdt'
): Promise<DiagnosisResult> => {
  
  // Bước đầu tiên: Kiểm tra ngưỡng khí (Screening)
  if (!isAboveThreshold(gasData)) {
    return {
      faultType: lang === 'vi' ? "Bình thường" : "Normal",
      confidence: "High",
      severity: "Normal",
      description: lang === 'vi' 
        ? "Kết luận: Máy biến áp bình thường, tình trạng tốt. Tất cả nồng độ khí hòa tan (DGA) đều nằm dưới ngưỡng cảnh báo sớm."
        : "Conclusion: Transformer is normal and in good condition. All DGA gas concentrations are below early warning thresholds.",
      recommendation: lang === 'vi'
        ? "Tiếp tục vận hành và thực hiện theo dõi nồng độ khí định kỳ theo quy trình bảo dưỡng."
        : "Continue normal operation and perform periodic gas analysis according to maintenance procedures.",
      keyGasRatios: []
    };
  }

  // Nếu vượt ngưỡng, thực hiện dự đoán bằng mô hình học máy
  if (modelType === 'fasttree') {
    return diagnoseWithFastTree(gasData, lang);
  } else {
    return diagnoseWithGBDT(gasData, lang);
  }
};

const diagnoseWithGBDT = async (gasData: GasData, lang: Language): Promise<DiagnosisResult> => {
  const API_URL = "https://vutrhuy81-dga-prediction-api.hf.space/predict";
  
  const modelInput = {
    H2: gasData.H2,
    CH4: gasData.CH4,
    C2H6: gasData.C2H6,
    C2H4: gasData.C2H4,
    C2H2: gasData.C2H2
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify(modelInput),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown Server Error");
      throw new Error(`Server Error (${response.status}): ${errorText.substring(0, 100)}`);
    }

    const data: FastApiResponse = await response.json();
    return mapGBDTResponseToDiagnosis(data, lang);

  } catch (error: any) {
    console.error("GBDT API Error:", error);
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        const msg = lang === 'vi' 
            ? "Không thể kết nối tới mô hình GBDT. Vui lòng thử lại sau."
            : "Cannot connect to GBDT Model. Please try again later.";
       throw new Error(msg); 
    }
    throw error;
  }
};

const diagnoseWithFastTree = async (gasData: GasData, lang: Language): Promise<DiagnosisResult> => {
  const PREDICT_URL = `${PROXY_HOST}/proxy/predict`;
  
  const modelInput = {
    H2: gasData.H2,
    CH4: gasData.CH4,
    C2H6: gasData.C2H6,
    C2H4: gasData.C2H4,
    C2H2: gasData.C2H2
  };

  try {
    const token = await loginFastTree();

    const response = await fetch(PREDICT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(modelInput)
    });

    if (!response.ok) {
       console.error("Predict Failed Status:", response.status);
       throw new Error(`CPC API Error via Proxy: ${response.status}`);
    }

    const data: CPCPredictResponse = await response.json();
    return mapFastTreeResponseToDiagnosis(data, lang);

  } catch (error: any) {
    console.error("FastTree API Error:", error);
    const msg = lang === 'vi' 
      ? "Lỗi kết nối mô hình FastTree. Vui lòng kiểm tra lại Proxy hoặc kết nối mạng."
      : "Error connecting to FastTree model via Proxy.";
    throw new Error(msg);
  }
};

// ... (Các hàm map giữ nguyên như cũ)
export const mapGBDTResponseToDiagnosis = (data: FastApiResponse, lang: Language): DiagnosisResult => {
    const faultCode = data.ket_qua_loi; 
    const faultInfo = FAULT_MAPPING[faultCode] || { 
      type: { en: `Unknown Fault Code (${faultCode})`, vi: `Mã lỗi lạ (${faultCode})` }, 
      severity: "Caution", 
      desc: { en: "Unknown", vi: "Không xác định" } 
    };

    const confidenceStr = String(data.do_tin_cay).replace('%', '');
    const confidenceVal = parseFloat(confidenceStr);
    let confidenceLevel: "High" | "Medium" | "Low" = "Low";
    if (confidenceVal >= 80) confidenceLevel = "High";
    else if (confidenceVal >= 50) confidenceLevel = "Medium";

    let probs = "";
    if (Array.isArray(data.chi_tiet_xac_suat) && data.chi_tiet_xac_suat.length === MODEL_LABELS_ORDER.length) {
        probs = data.chi_tiet_xac_suat
            .map((p, index) => ({ label: MODEL_LABELS_ORDER[index], val: p * 100 }))
            .filter(item => item.val > 0.01) 
            .sort((a, b) => b.val - a.val) 
            .map(item => `${item.label}: ${item.val.toFixed(1)}%`)
            .join(", ");
    }

    const recText = lang === 'vi' 
        ? `Mô hình GBDT phát hiện ${faultInfo.type.vi} với độ tin cậy ${data.do_tin_cay}.`
        : `GBDT model detected ${faultInfo.type.en} with ${data.do_tin_cay} confidence.`;

    return {
      faultType: faultInfo.type[lang],
      confidence: confidenceLevel,
      severity: faultInfo.severity,
      description: `GBDT Result: [${faultCode}]\nDetails: ${probs}`,
      recommendation: recText,
      keyGasRatios: [
        {
          ratioName: "Score (Max)",
          value: confidenceVal,
          interpretation: `${data.do_tin_cay}`
        }
      ]
    };
};

export const mapFastTreeResponseToDiagnosis = (data: CPCPredictResponse, lang: Language): DiagnosisResult => {
    const faultCode = data.predictedLabel;
    const faultInfo = FAULT_MAPPING[faultCode] || { 
      type: { en: `Unknown Fault (${faultCode})`, vi: `Mã lỗi lạ (${faultCode})` }, 
      severity: "Caution", 
      desc: { en: "Unknown", vi: "Không xác định" } 
    };

    let maxScore = 0;
    if (data.score && Array.isArray(data.score)) {
      maxScore = Math.max(...data.score);
    }
    const confidencePercent = (maxScore * 100).toFixed(2) + "%";
    
    let confidenceLevel: "High" | "Medium" | "Low" = "Low";
    if (maxScore >= 0.8) confidenceLevel = "High";
    else if (maxScore >= 0.5) confidenceLevel = "Medium";

    const recText = lang === 'vi' 
        ? `Mô hình FastTree phát hiện ${faultInfo.type.vi} (${confidencePercent}).`
        : `FastTree model detected ${faultInfo.type.en} (${confidencePercent}).`;

    return {
      faultType: faultInfo.type[lang],
      confidence: confidenceLevel,
      severity: faultInfo.severity,
      description: `FastTreeOva Result: [${faultCode}] - ${faultInfo.desc[lang]}`,
      recommendation: recText,
      keyGasRatios: [
        {
          ratioName: "Score (Max)",
          value: maxScore * 100,
          interpretation: confidencePercent
        }
      ]
    };
};

export const mapApiResponseToDiagnosis = (data: any, lang: Language): DiagnosisResult => {
    return mapGBDTResponseToDiagnosis(data as FastApiResponse, lang);
}
