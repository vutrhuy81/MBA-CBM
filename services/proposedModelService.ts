import { GasData, DiagnosisResult, Language } from "../types";

interface FastApiResponse {
  ket_qua_loi: string;
  do_tin_cay: string;
  chi_tiet_xac_suat: number[];
}

// ⚠️ QUAN TRỌNG: Thứ tự này BẮT BUỘC phải giống y hệt biến LABELS trong Python
// Python: LABELS = ["PD", "D1", "D2", "T1", "T2", "T3", "DT", "N"]
const MODEL_LABELS_ORDER = ["PD", "D1", "D2", "T1", "T2", "T3", "DT", "N"];

// Mapping from standard DGA Fault Codes to Readable Data with i18n support
const FAULT_MAPPING: Record<string, { 
    type: { en: string; vi: string }; 
    severity: "Normal" | "Caution" | "Critical"; 
    desc: { en: string; vi: string } 
}> = {
  "N": { 
    type: { en: "Normal", vi: "Bình thường" },
    severity: "Normal", 
    desc: { 
        en: "Transformer condition appears normal.",
        vi: "Tình trạng máy biến áp có vẻ bình thường."
    }
  },
  "PD": { 
    type: { en: "Partial Discharge", vi: "Phóng điện cục bộ" },
    severity: "Caution", 
    desc: {
        en: "Low energy discharges (Corona) detected.",
        vi: "Phát hiện phóng điện năng lượng thấp (Corona)."
    }
  },
  "D1": { 
    type: { en: "Low Energy Discharge", vi: "Phóng điện năng lượng thấp" },
    severity: "Caution", 
    desc: {
        en: "Discharges of low energy (Sparking) detected.",
        vi: "Phát hiện phóng điện năng lượng thấp (Tia lửa điện)."
    }
  },
  "D2": { 
    type: { en: "High Energy Discharge", vi: "Phóng điện năng lượng cao" },
    severity: "Critical", 
    desc: {
        en: "Discharges of high energy (Arcing) detected. Immediate attention recommended.",
        vi: "Phát hiện phóng điện năng lượng cao (Hồ quang). Cần chú ý ngay lập tức."
    }
  },
  "T1": { 
    type: { en: "Thermal Fault < 300°C", vi: "Lỗi nhiệt < 300°C" },
    severity: "Caution", 
    desc: {
        en: "Low range thermal fault detected.",
        vi: "Phát hiện lỗi nhiệt độ thấp."
    }
  },
  "T2": { 
    type: { en: "Thermal Fault 300-700°C", vi: "Lỗi nhiệt 300-700°C" },
    severity: "Caution", 
    desc: {
        en: "Medium range thermal fault detected.",
        vi: "Phát hiện lỗi nhiệt độ trung bình."
    }
  },
  "T3": { 
    type: { en: "Thermal Fault > 700°C", vi: "Lỗi nhiệt > 700°C" },
    severity: "Critical", 
    desc: {
        en: "High range thermal fault detected. Risk of insulation degradation.",
        vi: "Phát hiện lỗi nhiệt độ cao. Nguy cơ suy giảm cách điện."
    }
  },
  "DT": { 
    type: { en: "Mix Thermal & Discharge", vi: "Hỗn hợp Nhiệt & Phóng điện" },
    severity: "Critical", 
    desc: {
        en: "Combined thermal and electrical fault detected. Complex failure mode.",
        vi: "Phát hiện lỗi kết hợp nhiệt và điện. Chế độ lỗi phức tạp."
    }
  },
};

export const diagnoseWithProposedModel = async (gasData: GasData, lang: Language): Promise<DiagnosisResult> => {
  // ⚠️ Lưu ý: Cần cập nhật link này mỗi khi chạy lại Colab
  //const API_URL = "https://kirstin-unnominated-wilber.ngrok-free.dev/predict";
  const API_URL = "https://vutrhuy81-dga-prediction-api.hf.space/predict";

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify({
        H2: gasData.H2,
        CH4: gasData.CH4,
        C2H6: gasData.C2H6,
        C2H4: gasData.C2H4,
        C2H2: gasData.C2H2
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown Server Error");
      throw new Error(`Server Error (${response.status}): ${errorText.substring(0, 100)}`);
    }

    const data: FastApiResponse = await response.json();
    return mapApiResponseToDiagnosis(data, lang);

  } catch (error: any) {
    console.error("Proposed Model API Error:", error);
    
    // Bắt lỗi CORS hoặc sai Link Ngrok
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        const msg = lang === 'vi' 
            ? "Không thể kết nối tới AI Model. Vui lòng kiểm tra xem URL Ngrok còn hoạt động không."
            : "Cannot connect to AI Model. Please check if the Ngrok URL is active.";
       throw new Error(msg); 
    }

    throw new Error(error.message || "Could not connect to the Prediction Model API.");
  }
};

export const mapApiResponseToDiagnosis = (data: FastApiResponse, lang: Language): DiagnosisResult => {
    // 1. Process Fault Code
    const faultCode = data.ket_qua_loi; 
    const faultInfo = FAULT_MAPPING[faultCode] || { 
      type: { en: `Unknown Fault Code (${faultCode})`, vi: `Mã lỗi lạ (${faultCode})` }, 
      severity: "Caution", 
      desc: { 
          en: "Model returned a classification code not in the standard mapping.",
          vi: "Mô hình trả về mã phân loại không có trong danh sách chuẩn."
      } 
    };

    // 2. Process Confidence
    const confidenceStr = String(data.do_tin_cay).replace('%', '');
    const confidenceVal = parseFloat(confidenceStr);
    let confidenceLevel: "High" | "Medium" | "Low" = "Low";
    if (confidenceVal >= 80) confidenceLevel = "High";
    else if (confidenceVal >= 50) confidenceLevel = "Medium";

    // 3. Format Probability Distribution
    let probs = "";
    if (Array.isArray(data.chi_tiet_xac_suat) && data.chi_tiet_xac_suat.length === MODEL_LABELS_ORDER.length) {
        probs = data.chi_tiet_xac_suat
            .map((p, index) => ({ label: MODEL_LABELS_ORDER[index], val: p * 100 }))
            .filter(item => item.val > 1) 
            .sort((a, b) => b.val - a.val) 
            .map(item => `${item.label}: ${item.val.toFixed(1)}%`)
            .join(", ");
    } else if (Array.isArray(data.chi_tiet_xac_suat)) {
        probs = data.chi_tiet_xac_suat.map(p => (p * 100).toFixed(1) + "%").join(", ");
    }

    const titlePrefix = lang === 'vi' ? "Dự đoán AI" : "AI Prediction";
    const detailsPrefix = lang === 'vi' ? "Chi tiết" : "Details";
    const recText = lang === 'vi' 
        ? `Mô hình AI phát hiện ${faultInfo.type.vi} với độ tin cậy ${data.do_tin_cay}.`
        : `The AI model detected ${faultInfo.type.en} with ${data.do_tin_cay} confidence.`;
    const ratioName = lang === 'vi' ? "Độ tin cậy AI" : "AI Confidence";
    const ratioInterp = lang === 'vi' ? `Độ chắc chắn: ${data.do_tin_cay}` : `Model certainty: ${data.do_tin_cay}`;

    return {
      faultType: faultInfo.type[lang],
      confidence: confidenceLevel,
      severity: faultInfo.severity,
      description: `${titlePrefix}: [${faultCode}] - ${faultInfo.desc[lang]}\n${detailsPrefix}: ${probs}`,
      recommendation: recText,
      keyGasRatios: [
        {
          ratioName: ratioName,
          value: confidenceVal,
          interpretation: ratioInterp
        }
      ]
    };
}