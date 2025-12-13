import React, { useState } from 'react';
import { DiagnosisResult, GasData, GroundingChunk, Language } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis 
} from 'recharts';
import { searchStandards } from '../services/geminiService';
import { translations } from '../constants/translations';
import { getDuval1Analysis } from '../utils/duvalMath';
import DuvalTriangle from './DuvalTriangle';
import DuvalPentagon from './DuvalPentagon';

interface DiagnosisViewProps {
  result: DiagnosisResult | null;
  gasData: GasData;
  lang: Language;
}

const DiagnosisView: React.FC<DiagnosisViewProps> = ({ result, gasData, lang }) => {
  const [searchResult, setSearchResult] = useState<{ text: string, chunks?: GroundingChunk[] } | null>(null);
  const [searching, setSearching] = useState(false);
  const t = translations[lang];

  if (!result) return null;

  const barData = [
    { name: 'H2', value: gasData.H2, fill: '#a855f7' },
    { name: 'CH4', value: gasData.CH4, fill: '#3b82f6' },
    { name: 'C2H6', value: gasData.C2H6, fill: '#22c55e' },
    { name: 'C2H4', value: gasData.C2H4, fill: '#eab308' },
    { name: 'C2H2', value: gasData.C2H2, fill: '#ef4444' },
  ];

  const radarData = [
    { subject: 'H2', A: gasData.H2, fullMark: 1000 },
    { subject: 'CH4', A: gasData.CH4, fullMark: 1000 },
    { subject: 'C2H6', A: gasData.C2H6, fullMark: 1000 },
    { subject: 'C2H4', A: gasData.C2H4, fullMark: 1000 },
    { subject: 'C2H2', A: gasData.C2H2, fullMark: 1000 },
  ];

  // Calculate Duval Data (Only Duval 1)
  const d1 = getDuval1Analysis(gasData);

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'text-red-500 border-red-500/50 bg-red-500/10';
      case 'caution': return 'text-yellow-500 border-yellow-500/50 bg-yellow-500/10';
      default: return 'text-green-500 border-green-500/50 bg-green-500/10';
    }
  };

  const handleSearch = async () => {
    setSearching(true);
    const res = await searchStandards(`transformer fault diagnosis for ${result.faultType} with current gas levels`, lang);
    setSearchResult(res);
    setSearching(false);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      {/* Top Cards: Classification */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-6 rounded-2xl border ${getSeverityColor(result.severity)} flex flex-col justify-center items-center text-center shadow-lg`}>
          <span className="text-sm font-semibold uppercase tracking-widest opacity-80 mb-2">{t.predictedFault}</span>
          <span className="text-2xl font-bold">{result.faultType}</span>
        </div>
        <div className="p-6 rounded-2xl bg-slate-800 border border-slate-700 flex flex-col justify-center items-center text-center shadow-lg">
          <span className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-2">{t.severity}</span>
          <span className={`text-2xl font-bold ${getSeverityColor(result.severity).split(' ')[0]}`}>{result.severity}</span>
        </div>
        <div className="p-6 rounded-2xl bg-slate-800 border border-slate-700 flex flex-col justify-center items-center text-center shadow-lg">
          <span className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-2">{t.confidence}</span>
          <span className="text-2xl font-bold text-white">{result.confidence}</span>
        </div>
      </div>

      {/* Analysis and Recommendation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
          <h3 className="text-lg font-semibold text-white mb-4 border-b border-slate-700 pb-2">{t.analysis}</h3>
          <p className="text-slate-300 leading-relaxed text-sm md:text-base whitespace-pre-line">{result.description}</p>
          
          <div className="mt-6">
            <h4 className="text-sm font-medium text-slate-400 mb-3">{t.keyRatios}</h4>
            <div className="space-y-2">
              {result.keyGasRatios.map((ratio, idx) => (
                <div key={idx} className="flex justify-between items-center bg-slate-900/50 p-2 rounded-lg">
                  <span className="text-sm font-mono text-blue-400">{ratio.ratioName}</span>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">{ratio.interpretation}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg flex flex-col">
          <h3 className="text-lg font-semibold text-white mb-4 border-b border-slate-700 pb-2">{t.recommendation}</h3>
          <p className="text-slate-300 leading-relaxed mb-6 flex-grow">{result.recommendation}</p>
          
          <button 
            onClick={handleSearch}
            disabled={searching}
            className="mt-auto flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors"
          >
             {searching ? (
                <span className="animate-pulse">{t.searching}</span>
             ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                  {t.searchStandards}
                </>
             )}
          </button>
        </div>
      </div>

      {/* Search Results */}
      {searchResult && (
        <div className="bg-slate-800 p-6 rounded-2xl border border-blue-900/50 shadow-lg">
          <h3 className="text-lg font-semibold text-blue-400 mb-2">{t.groundingSources}</h3>
          <div className="text-slate-300 text-sm mb-4 whitespace-pre-line">{searchResult.text}</div>
          {searchResult.chunks && searchResult.chunks.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {searchResult.chunks.map((chunk, i) => (chunk.web?.uri && chunk.web?.title) ? (
                 <a key={i} href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="text-xs bg-slate-900 text-blue-400 border border-slate-700 px-3 py-1 rounded-full hover:bg-slate-700 transition">
                   {chunk.web.title}
                 </a>
              ) : null)}
            </div>
          )}
        </div>
      )}

      {/* Basic Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Bar Chart */}
        <div className="bg-slate-800 p-4 md:p-6 rounded-2xl border border-slate-700 shadow-lg h-96 flex flex-col">
          <h3 className="text-lg font-semibold text-white mb-2">{t.gasChartTitle}</h3>
          <div className="flex-grow w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis 
                    dataKey="name" 
                    stroke="#94a3b8" 
                    interval={0} 
                    tick={{ fontSize: 12, fill: '#94a3b8' }} 
                    tickMargin={8}
                />
                <YAxis 
                    stroke="#94a3b8" 
                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                    width={40}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radar Chart */}
        <div className="bg-slate-800 p-4 md:p-6 rounded-2xl border border-slate-700 shadow-lg h-96 flex flex-col">
          <h3 className="text-lg font-semibold text-white mb-2">{t.radarChartTitle}</h3>
          <div className="flex-grow w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis 
                    dataKey="subject" 
                    stroke="#94a3b8" 
                    tick={{ fontSize: 12, fill: '#94a3b8' }} 
                />
                <PolarRadiusAxis 
                    angle={30} 
                    domain={[0, 'auto']} 
                    stroke="#475569" 
                    tick={{ fontSize: 10, fill: '#64748b' }} 
                />
                <Radar
                  name="Gas Level"
                  dataKey="A"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="#3b82f6"
                  fillOpacity={0.4}
                />
                <Tooltip 
                   contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Duval Analysis Section */}
      <div className="mt-4">
        <h3 className="text-xl font-bold text-white mb-4">{t.duvalTitle}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Duval Triangle 1 */}
            <DuvalTriangle 
                type="1"
                title="Duval Triangle 1"
                description={t.duval1Desc}
                pA={d1.pA} pB={d1.pB} pC={d1.pC}
                labelA="%CH4" labelB="%C2H4" labelC="%C2H2"
            />
            {/* Duval Pentagon 1 */}
            <DuvalPentagon
                gasData={gasData}
                title="Duval Pentagon 1"
                description={t.duvalPentagonDesc}
            />
        </div>
      </div>
    </div>
  );
};

export default DiagnosisView;