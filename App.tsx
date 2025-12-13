import React, { useState } from 'react';
import { GasData, DiagnosisResult, Language } from './types';
import GasInput from './components/GasInput';
import DiagnosisView from './components/DiagnosisView';
import { diagnoseTransformer } from './services/geminiService';
import { diagnoseWithProposedModel, mapApiResponseToDiagnosis } from './services/proposedModelService';
import { translations } from './constants/translations';

type TabType = 'gemini' | 'proposed';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('gemini');
  const [lang, setLang] = useState<Language>('vi'); // Default to Vietnamese
  const [gasData, setGasData] = useState<GasData>({
    H2: 0,
    CH4: 0,
    C2H6: 0,
    C2H4: 0,
    C2H2: 0,
  });

  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = translations[lang];

  const handleDiagnose = async () => {
    setLoading(true);
    setError(null);
    try {
      let data: DiagnosisResult;
      if (activeTab === 'gemini') {
        data = await diagnoseTransformer(gasData, lang);
      } else {
        data = await diagnoseWithProposedModel(gasData, lang);
      }
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to run diagnosis.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateSuccess = () => {
    // Mock data based on the user's provided example
    const mockResponse = {
        ket_qua_loi: "D2",
        do_tin_cay: "98.94%",
        chi_tiet_xac_suat: [0.0002, 0.0003, 0.0036, 0.0001, 0.9893, 0.0037, 0.0005, 0.0019]
    };
    const mockDiagnosis = mapApiResponseToDiagnosis(mockResponse, lang);
    setResult(mockDiagnosis);
    setError(null);
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setResult(null); 
    setError(null);
  };

  const isCorsError = error?.includes("CORS") || error?.includes("Network Error") || error?.includes("Failed to fetch") || error?.includes("Kết nối");

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 pb-20">
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
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col gap-8">
          
          {/* Intro Text */}
          <div className="text-center max-w-2xl mx-auto mb-4">
            <h2 className="text-3xl font-bold text-white mb-2">
              {activeTab === 'gemini' ? t.introGemini : t.introProposed}
            </h2>
            <p className="text-slate-400">
              {activeTab === 'gemini' 
                ? t.introGeminiDesc
                : t.introProposedDesc}
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
              />
            </div>

            {/* Results Column */}
            <div className="lg:col-span-8">
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="font-bold">{t.connectionError}</span>
                  </div>
                  
                  {isCorsError ? (
                    <div className="text-sm text-slate-300">
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
                    <p>{error}</p>
                  )}
                </div>
              )}
              
              {!result && !loading && !error && (
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-slate-500 bg-slate-800/30 rounded-2xl border-2 border-dashed border-slate-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p className="text-lg font-medium">{t.awaitingData}</p>
                  <p className="text-sm">
                    {activeTab === 'gemini' 
                      ? t.awaitingGemini 
                      : t.awaitingProposed}
                  </p>
                  {activeTab === 'proposed' && (
                    <p className="text-xs text-slate-600 mt-4 max-w-xs text-center">
                      {t.connectedNgrok}
                    </p>
                  )}
                </div>
              )}

              <DiagnosisView result={result} gasData={gasData} lang={lang} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;