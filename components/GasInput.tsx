import React from 'react';
import { GasData, Language } from '../types';
import { translations } from '../constants/translations';

interface GasInputProps {
  gasData: GasData;
  setGasData: React.Dispatch<React.SetStateAction<GasData>>;
  onDiagnose: () => void;
  loading: boolean;
  activeTab: 'gemini' | 'proposed';
  lang: Language;
}

const InputField = ({ 
  label, 
  value, 
  onChange, 
  color 
}: { 
  label: string; 
  value: number; 
  onChange: (val: number) => void; 
  color: string;
}) => (
  <div className="flex flex-col gap-1">
    <label className="text-sm font-medium text-slate-400">{label} (ppm)</label>
    <div className="relative">
      <input
        type="number"
        min="0"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
      />
      <div className={`absolute right-3 top-3 w-3 h-3 rounded-full ${color}`} />
    </div>
  </div>
);

const GasInput: React.FC<GasInputProps> = ({ 
  gasData, 
  setGasData, 
  onDiagnose, 
  loading, 
  activeTab,
  lang
}) => {
  const t = translations[lang];
  
  const handlePreset = (preset: GasData) => {
    setGasData(preset);
  };

  const geminiPresets = {
    "Normal": { H2: 10, CH4: 5, C2H6: 2, C2H4: 1, C2H2: 0 },
    "Arcing": { H2: 500, CH4: 150, C2H6: 20, C2H4: 300, C2H2: 800 },
    "Thermal > 700": { H2: 100, CH4: 800, C2H6: 300, C2H4: 1200, C2H2: 10 },
  };

  const proposedModelPresets = {
    "Ex 1 (DT)": { H2: 152.0, CH4: 254.0, C2H6: 908.0, C2H4: 2250.0, C2H2: 4830.0 },
    "Ex 2 (D2)": { H2: 277.0, CH4: 142.0, C2H6: 59.0, C2H4: 802.0, C2H2: 3840.0 },
    "Ex 3 (D1)": { H2: 921.0, CH4: 42.0, C2H6: 3.0, C2H4: 75.0, C2H2: 713.0 },
    "Ex 4 (T3)": { H2: 36.0, CH4: 101.0, C2H6: 35.0, C2H4: 193.0, C2H2: 0.0 },
    "Ex 5 (T2)": { H2: 122.0, CH4: 50.0, C2H6: 31.0, C2H4: 69.0, C2H2: 0.0 },
    "Ex 6 (T1)": { H2: 104.0, CH4: 37.0, C2H6: 11.0, C2H4: 11.0, C2H2: 0.0 },
    "Ex 7 (PD)": { H2: 9350.0, CH4: 188.0, C2H6: 28.0, C2H4: 228.0, C2H2: 0.0 },
    "Ex 8 (N)": { H2: 8.0, CH4: 14.0, C2H6: 22.0, C2H4: 6.0, C2H2: 0.0 },
  };

  const activePresets = activeTab === 'gemini' ? geminiPresets : proposedModelPresets;

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-700 shadow-xl">
      <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
        {activeTab === 'gemini' ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
        ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
        )}
        {activeTab === 'gemini' ? t.inputTitleGemini : t.inputTitleProposed}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <InputField 
          label="Hydrogen (H2)" 
          value={gasData.H2} 
          onChange={(v) => setGasData({...gasData, H2: v})} 
          color="bg-purple-500"
        />
        <InputField 
          label="Methane (CH4)" 
          value={gasData.CH4} 
          onChange={(v) => setGasData({...gasData, CH4: v})} 
          color="bg-blue-500"
        />
        <InputField 
          label="Ethane (C2H6)" 
          value={gasData.C2H6} 
          onChange={(v) => setGasData({...gasData, C2H6: v})} 
          color="bg-green-500"
        />
        <InputField 
          label="Ethylene (C2H4)" 
          value={gasData.C2H4} 
          onChange={(v) => setGasData({...gasData, C2H4: v})} 
          color="bg-yellow-500"
        />
        <InputField 
          label="Acetylene (C2H2)" 
          value={gasData.C2H2} 
          onChange={(v) => setGasData({...gasData, C2H2: v})} 
          color="bg-red-500"
        />
      </div>

      <div className="mb-6">
        <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wider">
          {activeTab === 'gemini' ? t.loadExample : t.loadTest}
        </p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(activePresets).map(([name, data]) => (
            <button
              key={name}
              onClick={() => handlePreset(data)}
              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-full transition-colors"
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onDiagnose}
        disabled={loading}
        className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]
          ${loading 
            ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
            : activeTab === 'gemini' 
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white'
              : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white'
          }`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {t.processing}
          </span>
        ) : (
          activeTab === 'gemini' ? t.runGemini : t.runProposed
        )}
      </button>
    </div>
  );
};

export default GasInput;