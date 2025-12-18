
import React, { useState, useEffect } from 'react';
import { GasData, DiagnosisResult, Language, ModelType, HealthIndexResult } from './types';
import GasInput from './components/GasInput';
import DiagnosisView from './components/DiagnosisView';
import HealthIndexView from './components/HealthIndexView';
import { diagnoseTransformer } from './services/geminiService';
import { diagnoseWithProposedModel, mapApiResponseToDiagnosis, mapFastTreeResponseToDiagnosis } from './services/proposedModelService';
import { calculateHealthIndex } from './services/healthIndexService';
import { translations } from './constants/translations';
import { getDuval1Analysis, getDuvalPentagonAnalysis } from './utils/duvalMath';

type TabType = 'gemini' | 'proposed' | 'health';

interface DiagnosisHistoryItem {
  gas: GasData;
  result: DiagnosisResult;
  timestamp: string;
  duvalTriangle: string;
  duvalPentagon: string;
}

interface MainPageProps {
  user: string;
  onLogout: () => void;
}

const MainPage: React.FC<MainPageProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<TabType>('gemini');
  const [lang, setLang] = useState<Language>('vi'); 
  const [selectedModel, setSelectedModel] = useState<ModelType>('gbdt');

  const [gasData, setGasData] = useState<GasData>({
    H2: 0,
    CH4: 0,
    C2H6: 0,
    C2H4: 0,
    C2H2: 0,
    CO: 0,
    CO2: 0,
    O2: 0,
    N2: 0,
  });

  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [healthResult, setHealthResult] = useState<HealthIndexResult | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<DiagnosisHistoryItem[]>([]);

  const t = translations[lang];

  const addToHistory = (gas: GasData, diagResult: DiagnosisResult) => {
    const duvalT = getDuval1Analysis(gas).zone;
    const duvalP = getDuvalPentagonAnalysis(gas);
    
    const newItem: DiagnosisHistoryItem = {
      gas: { ...gas },
      result: diagResult,
      timestamp: new Date().toLocaleString('vi-VN'), 
      duvalTriangle: duvalT,
      duvalPentagon: duvalP,
    };

    setHistory(prev => [...prev, newItem]);
  };

  const handleDiagnose = async () => {
    setLoading(true);
    setError(null);
    setResult(null); 
    setHealthResult(null);

    try {
      if (activeTab === 'gemini') {
        const data = await diagnoseTransformer(gasData, lang);
        setResult(data);
      } else if (activeTab === 'proposed') {
        const data = await diagnoseWithProposedModel(gasData, lang, selectedModel);
        addToHistory(gasData, data);
        setResult(data);
      } else if (activeTab === 'health') {
        let gbdtFault = "N";
        try {
            const data = await diagnoseWithProposedModel(gasData, lang, 'gbdt');
            const match = data.description.match(/\[(.*?)\]/);
            if (match && match[1]) {
                gbdtFault = match[1];
            }
        } catch (e) {
            console.warn("Could not fetch GBDT result for Health Index", e);
        }
        const hIndex = calculateHealthIndex(gasData, gbdtFault);
        setHealthResult(hIndex);
      }
    } catch (err: any) {
      setError(err.message || "Failed to run diagnosis.");
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateSuccess = () => {
    if (activeTab === 'health') {
        const mockHI = calculateHealthIndex(gasData, "D2");
        setHealthResult(mockHI);
    } else if (activeTab === 'proposed' && selectedModel === 'fasttree') {
        const mockResponse = {
            h2: gasData.H2 || 100, cH4: gasData.CH4 || 100, c2H6: gasData.C2H6 || 11,
            c2H4: gasData.C2H4 || 12, c2H2: gasData.C2H2 || 15, type: 0,
            features: [100, 100, 11, 12, 15], predictedLabel: "D2", score: [0, 0, 0.8, 0]
        };
        const mockDiagnosis = mapFastTreeResponseToDiagnosis(mockResponse, lang);
        setResult(mockDiagnosis);
    } else {
        const mockResponse = {
            ket_qua_loi: "D2", do_tin_cay: "98.94%",
            chi_tiet_xac_suat: [0.0002, 0.0003, 0.0036, 0.0001, 0.9893, 0.0037, 0.0005, 0.0019]
        };
        const mockDiagnosis = mapApiResponseToDiagnosis(mockResponse, lang);
        setResult(mockDiagnosis);
    }
    setError(null);
  };

  const handleDownloadCsv = () => {
    if (history.length === 0) return;
    const BOM = "\uFEFF";
    const headers = ["H2", "CH4", "C2H6", "C2H4", "C2H2", "Fault", "Severity", "Confidence", "Analysis", "Rec", "Time", "Duval T1", "Duval P1"];
    const safeStr = (str: string) => `"${(str || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`;
    const rows = history.map(item => [
        item.gas.H2, item.gas.CH4, item.gas.C2H6, item.gas.C2H4, item.gas.C2H2,
        safeStr(item.result.faultType), safeStr(item.result.severity), safeStr(item.result.confidence),
        safeStr(item.result.description), safeStr(item.result.recommendation),
        safeStr(item.timestamp), safeStr(item.duvalTriangle), safeStr(item.duvalPentagon)
    ]);
    const csvContent = BOM + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "chandoan.csv";
    link.click();
  };

  const isCorsError = error?.includes("CORS") || error?.includes("Network Error") || error?.includes("Failed to fetch");

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 pb-20 font-sans animate-fade-in">
      <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">{t.appTitle}</h1>
              <div className="flex items-center gap-2">
                <p className="text-xs text-slate-400 font-medium">{t.appSubtitle}</p>
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-emerald-400 font-bold uppercase">
                   User: {user}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
                <button onClick={() => setLang('vi')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${lang === 'vi' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}>VN</button>
                <button onClick={() => setLang('en')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${lang === 'en' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}>EN</button>
            </div>
            <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
                <button onClick={() => setActiveTab('gemini')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'gemini' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>{t.geminiTab}</button>
                <button onClick={() => setActiveTab('proposed')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'proposed' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}>{t.proposedTab}</button>
                <button onClick={() => setActiveTab('health')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'health' ? 'bg-rose-600 text-white' : 'text-slate-400'}`}>{t.healthIndexTab}</button>
            </div>
            <button 
                onClick={onLogout}
                className="p-2 text-slate-400 hover:text-red-400 transition-colors bg-slate-800 rounded-lg border border-slate-700"
                title="Đăng xuất"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col gap-8">
          <div className="text-center max-w-2xl mx-auto mb-4">
            <h2 className="text-3xl font-bold text-white mb-2">
              {activeTab === 'gemini' ? t.introGemini : (activeTab === 'proposed' ? t.introProposed : t.introHealth)}
            </h2>
            <p className="text-slate-400">
              {activeTab === 'gemini' ? t.introGeminiDesc : (activeTab === 'proposed' ? t.introProposedDesc : t.introHealthDesc)}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4">
              <GasInput 
                gasData={gasData} setGasData={setGasData} onDiagnose={handleDiagnose}
                loading={loading} activeTab={activeTab} lang={lang}
                selectedModel={selectedModel} onSelectModel={setSelectedModel}
              />
              {activeTab === 'proposed' && history.length > 0 && (
                <button onClick={handleDownloadCsv} className="w-full mt-4 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-sm flex items-center justify-center gap-2 border border-slate-600 shadow-lg transition-all">
                    Lưu file chandoan.csv ({history.length} dòng)
                </button>
              )}
            </div>

            <div className="lg:col-span-8">
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl mb-4 animate-shake">
                  <p className="font-bold">{t.error}: {error}</p>
                  {isCorsError && (
                    <button onClick={handleSimulateSuccess} className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition text-xs font-bold">
                        {t.simulateSuccess}
                    </button>
                  )}
                </div>
              )}
              {!result && !healthResult && !loading && !error && (
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-slate-500 bg-slate-800/30 rounded-2xl border-2 border-dashed border-slate-700">
                  <p className="text-lg font-medium">{t.awaitingData}</p>
                </div>
              )}
              {activeTab === 'health' ? (
                  <HealthIndexView result={healthResult} lang={lang} />
              ) : (
                  <DiagnosisView result={result} gasData={gasData} lang={lang} activeTab={activeTab === 'proposed' ? 'proposed' : 'gemini'} />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MainPage;
