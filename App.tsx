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

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('gemini');
  const [lang, setLang] = useState<Language>('vi'); // Default to Vietnamese
  
  // New State for Model Selection
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

  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [userApiKey, setUserApiKey] = useState('');

  // History State for CSV
  const [history, setHistory] = useState<DiagnosisHistoryItem[]>([]);

  useEffect(() => {
    // Load stored key on mount
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) setUserApiKey(storedKey);
  }, []);

  const t = translations[lang];

  const handleSaveSettings = () => {
    localStorage.setItem('gemini_api_key', userApiKey);
    setShowSettings(false);
    setError(null); // Clear previous errors
  };

  const addToHistory = (gas: GasData, diagResult: DiagnosisResult) => {
    const duvalT = getDuval1Analysis(gas).zone;
    const duvalP = getDuvalPentagonAnalysis(gas);
    
    const newItem: DiagnosisHistoryItem = {
      gas: { ...gas },
      result: diagResult,
      // Format timestamp specifically for logging
      timestamp: new Date().toLocaleString('vi-VN'), 
      duvalTriangle: duvalT,
      duvalPentagon: duvalP,
    };

    setHistory(prev => [...prev, newItem]);
  };

  const handleDiagnose = async () => {
    setLoading(true);
    setError(null);
    setResult(null); // Reset previous result
    setHealthResult(null);

    try {
      if (activeTab === 'gemini') {
        const data = await diagnoseTransformer(gasData, lang);
        setResult(data);
      } else if (activeTab === 'proposed') {
        // Pass the selected model type
        const data = await diagnoseWithProposedModel(gasData, lang, selectedModel);
        // Save to history automatically for Proposed Model
        addToHistory(gasData, data);
        setResult(data);
      } else if (activeTab === 'health') {
        // Health Index Logic
        // 1. Must run GBDT Model first to get the Fault Code (needed for HI_FF)
        // We use 'gbdt' explicitly as per requirement for Fault Factor
        let gbdtFault = "N";
        try {
            const data = await diagnoseWithProposedModel(gasData, lang, 'gbdt');
            // Extract code from description like "GBDT Result: [D1]..." or rely on a property if we added one.
            // Currently mapping logic returns localized string. 
            // We need the raw code. The easiest way is to re-parse or assume the Service returns it.
            // Let's assume the service maps "faultType" nicely but we need the raw Code for mapping HI.
            // Hack: The description contains "[Code]". Let's extract it.
            const match = data.description.match(/\[(.*?)\]/);
            if (match && match[1]) {
                gbdtFault = match[1];
            }
        } catch (e) {
            console.warn("Could not fetch GBDT result for Health Index, defaulting to Normal (N)", e);
        }

        // 2. Calculate Health Index
        const hIndex = calculateHealthIndex(gasData, gbdtFault);
        setHealthResult(hIndex);
      }
    } catch (err: any) {
      if (err.message === "MISSING_API_KEY") {
        setError(t.missingApiKey);
        setShowSettings(true); // Auto open settings if key is missing
      } else {
        setError(err.message || "Failed to run diagnosis.");
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateSuccess = () => {
    if (activeTab === 'health') {
        // Mock Health Index
        const mockHI = calculateHealthIndex(gasData, "D2");
        setHealthResult(mockHI);
    } else if (activeTab === 'proposed' && selectedModel === 'fasttree') {
        // FastTree Mock Data
        const mockResponse = {
            h2: gasData.H2 || 100,
            cH4: gasData.CH4 || 100,
            c2H6: gasData.C2H6 || 11,
            c2H4: gasData.C2H4 || 12,
            c2H2: gasData.C2H2 || 15,
            type: 0,
            features: [100, 100, 11, 12, 15],
            predictedLabel: "D2",
            score: [0, 0, 0.826, 0, 0, 0, 0.173, 0, 0]
        };
        const mockDiagnosis = mapFastTreeResponseToDiagnosis(mockResponse, lang);
        setResult(mockDiagnosis);
        addToHistory(gasData, mockDiagnosis);
    } else {
        // GBDT Mock Data (Default)
        const mockResponse = {
            ket_qua_loi: "D2",
            do_tin_cay: "98.94%",
            chi_tiet_xac_suat: [0.0002, 0.0003, 0.0036, 0.0001, 0.9893, 0.0037, 0.0005, 0.0019]
        };
        const mockDiagnosis = mapApiResponseToDiagnosis(mockResponse, lang);
        setResult(mockDiagnosis);
        if (activeTab === 'proposed') {
            addToHistory(gasData, mockDiagnosis);
        }
    }
    setError(null);
  };

  const handleDownloadCsv = () => {
    if (history.length === 0) {
        alert(lang === 'vi' ? "Chưa có dữ liệu lịch sử." : "No history data.");
        return;
    }

    // Define BOM for Excel to read UTF-8 correctly
    const BOM = "\uFEFF";
    
    // Headers exactly as requested in Vietnamese
    const headers = [
        "H2", 
        "CH4", 
        "C2H6", 
        "C2H4", 
        "C2H2",
        "Loại lỗi dự đoán",
        "Mức độ",
        "Độ tin cậy",
        "Phân tích chi tiết",
        "Khuyến nghị",
        "Ngày giờ chẩn đoán lỗi",
        "kết quả chẩn đoán Duval Triangle",
        "Kết quả chẩn đoán Duval Pentagon 1"
    ];

    // Helper to safely format strings for CSV (escape quotes)
    const safeStr = (str: string) => `"${(str || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`;

    // Rows
    const rows = history.map(item => [
        item.gas.H2,
        item.gas.CH4,
        item.gas.C2H6,
        item.gas.C2H4,
        item.gas.C2H2,
        safeStr(item.result.faultType),
        safeStr(item.result.severity),
        safeStr(item.result.confidence),
        safeStr(item.result.description),
        safeStr(item.result.recommendation),
        safeStr(item.timestamp),
        safeStr(item.duvalTriangle),
        safeStr(item.duvalPentagon)
    ]);

    const csvContent = BOM + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "chandoan.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setResult(null); 
    setHealthResult(null);
    setError(null);
  };

  const isCorsError = error?.includes("CORS") || error?.includes("Network Error") || error?.includes("Failed to fetch") || error?.includes("Kết nối");

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 pb-20 font-sans">
      {/* Header */}
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
              <p className="text-xs text-slate-400 font-medium">{t.appSubtitle}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             {/* Settings Button */}
             <button 
                onClick={() => setShowSettings(true)}
                className="p-2 text-slate-400 hover:text-white bg-slate-800 border border-slate-700 rounded-lg transition-colors"
                title={t.settings}
             >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
             </button>

            {/* Language Toggle */}
            <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
                <button 
                    onClick={() => setLang('vi')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${lang === 'vi' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                    VN
                </button>
                <button 
                    onClick={() => setLang('en')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${lang === 'en' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                    EN
                </button>
            </div>

            {/* Tabs Navigation */}
            <div className="flex bg-slate-800 p-1 rounded-xl">
                <button
                onClick={() => handleTabChange('gemini')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    activeTab === 'gemini' 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                >
                {t.geminiTab}
                </button>
                <button
                onClick={() => handleTabChange('proposed')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    activeTab === 'proposed' 
                    ? 'bg-emerald-600 text-white shadow-lg' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                >
                {t.proposedTab}
                </button>
                <button
                onClick={() => handleTabChange('health')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    activeTab === 'health' 
                    ? 'bg-rose-600 text-white shadow-lg' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                >
                {t.healthIndexTab}
                </button>
            </div>
          </div>
        </div>
      </header>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl transform transition-all">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {t.settings}
                </h3>
                
                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                        {t.enterApiKey}
                    </label>
                    <input 
                        type="password"
                        value={userApiKey}
                        onChange={(e) => setUserApiKey(e.target.value)}
                        placeholder={t.apiKeyPlaceholder}
                        className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <p className="text-xs text-slate-500 mt-2">
                        {t.apiKeyNote} <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">Get key here</a>.
                    </p>
                </div>

                <div className="flex justify-end gap-3">
                    <button 
                        onClick={() => setShowSettings(false)}
                        className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors text-sm font-medium"
                    >
                        {t.cancel}
                    </button>
                    <button 
                        onClick={handleSaveSettings}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-lg transition-all text-sm font-bold"
                    >
                        {t.save}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col gap-8">
          
          {/* Intro Text */}
          <div className="text-center max-w-2xl mx-auto mb-4">
            <h2 className="text-3xl font-bold text-white mb-2">
              {activeTab === 'gemini' ? t.introGemini : (activeTab === 'proposed' ? t.introProposed : t.introHealth)}
            </h2>
            <p className="text-slate-400">
              {activeTab === 'gemini' 
                ? t.introGeminiDesc
                : (activeTab === 'proposed' ? t.introProposedDesc : t.introHealthDesc)}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Input Column */}
            <div className="lg:col-span-4">
              <GasInput 
                gasData={gasData} 
                setGasData={setGasData} 
                onDiagnose={handleDiagnose}
                loading={loading}
                activeTab={activeTab}
                lang={lang}
                selectedModel={selectedModel}
                onSelectModel={setSelectedModel}
              />
              
              {/* CSV Download Button for Proposed Model */}
              {activeTab === 'proposed' && history.length > 0 && (
                <div className="mt-4">
                    <button 
                        onClick={handleDownloadCsv}
                        className="w-full py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-sm flex items-center justify-center gap-2 border border-slate-600 shadow-lg transition-all"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Lưu file chandoan.csv ({history.length} dòng)
                    </button>
                    <p className="text-[10px] text-slate-500 text-center mt-2 italic">
                       * File sẽ được lưu vào thư mục Downloads mặc định. Vui lòng di chuyển vào thư mục data nếu cần.
                    </p>
                </div>
              )}
            </div>

            {/* Results Column */}
            <div className="lg:col-span-8">
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl mb-4 animate-shake">
                  <div className="flex items-center gap-2 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="font-bold">{t.error}</span>
                  </div>
                  
                  {isCorsError ? (
                    <div className="text-sm text-slate-300">
                      <p className="mb-2 font-medium">{t.connectionError}</p>
                      <p className="mb-2 font-medium">{t.whyPostman}</p>
                      <ul className="list-disc list-inside mb-3 text-slate-400 space-y-1">
                        <li>{t.corsExplanation1}</li>
                        <li>{t.corsExplanation2}</li>
                      </ul>

                      <div className="flex gap-3 mt-4">
                         <button 
                           onClick={handleSimulateSuccess}
                           className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition text-xs font-bold border border-emerald-500 shadow-lg"
                         >
                           {t.simulateSuccess}
                         </button>
                         <a 
                          href="https://kirstin-unnominated-wilber.ngrok-free.dev/docs" 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition text-center text-xs font-bold border border-slate-600"
                        >
                          {t.checkStatus}
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                        <p>{error}</p>
                        {error === t.missingApiKey && (
                            <button 
                                onClick={() => setShowSettings(true)}
                                className="mt-2 self-start px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm font-bold text-white transition-colors"
                            >
                                {t.settings}
                            </button>
                        )}
                    </div>
                  )}
                </div>
              )}
              
              {!result && !healthResult && !loading && !error && (
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-slate-500 bg-slate-800/30 rounded-2xl border-2 border-dashed border-slate-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p className="text-lg font-medium">{t.awaitingData}</p>
                  <p className="text-sm">
                    {activeTab === 'gemini' 
                      ? t.awaitingGemini 
                      : (activeTab === 'proposed' ? t.awaitingProposed : t.awaitingHealth)}
                  </p>
                  {activeTab === 'proposed' && (
                    <p className="text-xs text-slate-600 mt-4 max-w-xs text-center">
                      {t.connectedNgrok}
                    </p>
                  )}
                </div>
              )}

              {/* Views */}
              {activeTab === 'health' ? (
                  <HealthIndexView result={healthResult} lang={lang} />
              ) : (
                  <DiagnosisView 
                    result={result} 
                    gasData={gasData} 
                    lang={lang} 
                    activeTab={activeTab === 'proposed' ? 'proposed' : 'gemini'} 
                  />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;