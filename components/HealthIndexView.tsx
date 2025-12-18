
import React from 'react';
import { HealthIndexResult, Language } from '../types';
import { translations } from '../constants/translations';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface HealthIndexViewProps {
    result: HealthIndexResult | null;
    lang: Language;
}

const HealthIndexView: React.FC<HealthIndexViewProps> = ({ result, lang }) => {
    if (!result) return null;
    const t = translations[lang];

    const getConditionText = (hi: number) => {
        if (hi >= 0.9) return { text: t.conditionGood, color: "text-emerald-400" };
        if (hi >= 0.7) return { text: t.conditionFair, color: "text-blue-400" };
        if (hi >= 0.4) return { text: t.conditionPoor, color: "text-yellow-400" };
        return { text: t.conditionVeryPoor, color: "text-red-500" };
    }

    const dgafCondition = getConditionText(result.HI_DGAF);
    const ffCondition = getConditionText(result.HI_FF);
    const ledtfCondition = getConditionText(result.LEDTF);
    const pifCondition = getConditionText(result.PIF);

    // Final HI Logic for Display
    const getFinalConditionStyle = (cond: string) => {
        switch (cond) {
            case "Very Good": return "text-emerald-400";
            case "Good": return "text-blue-400";
            case "Need Caution": return "text-yellow-400";
            case "Poor": return "text-orange-500";
            case "Very Poor": return "text-red-500";
            default: return "text-slate-400";
        }
    };

    // Translate Condition
    const getTranslatedCondition = (cond: string) => {
        switch (cond) {
            case "Very Good": return t.condVeryGood;
            case "Good": return t.condGood;
            case "Need Caution": return t.condCaution;
            case "Poor": return t.condPoor;
            case "Very Poor": return t.condVeryPoor;
            default: return cond;
        }
    };

    const finalCondColor = getFinalConditionStyle(result.condition);
    const finalCondText = getTranslatedCondition(result.condition);

    // --- GAUGE DATA SETUP ---

    // 1. DGAF Gauge (Range 1.0 - 6.0, Lower is Better)
    // Left (180deg) is 1.0, Right (0deg) is 6.0
    const dgafGaugeData = [
        { name: 'Good', value: 1.2, color: '#10b981' },     // Green
        { name: 'Fair', value: 0.3, color: '#3b82f6' },     // Blue
        { name: 'Poor', value: 1.0, color: '#facc15' },     // Yellow
        { name: 'Very Poor', value: 3.5, color: '#ef4444' },// Red
    ];
    // Calculation: 1 is min, 6 is max.
    const dgafPercentage = Math.min(Math.max((result.DGAF - 1) / (6 - 1), 0), 1);
    const dgafRotation = 180 * dgafPercentage;

    // 2. HI Final Gauge (Range 0 - 100, Higher is Better)
    // To match visual consistency (Green on Left), we map 100 -> 180deg and 0 -> 0deg.
    // Order of slices in Recharts (Clockwise from 180):
    // 85-100 (Very Good), 70-85 (Good), 50-70 (Caution), 30-50 (Poor), 0-30 (Very Poor)
    const hiFinalGaugeData = [
        { name: 'Very Good', value: 15, color: '#10b981' }, // 85-100
        { name: 'Good', value: 15, color: '#3b82f6' },      // 70-85
        { name: 'Caution', value: 20, color: '#facc15' },   // 50-70
        { name: 'Poor', value: 20, color: '#f97316' },      // 30-50
        { name: 'Very Poor', value: 30, color: '#ef4444' }, // 0-30
    ];
    // Calculation: 100 is min rotation (Left), 0 is max rotation (Right).
    // Inverted logic for rotation: (100 - value) / 100
    const hiFinalPercentage = Math.min(Math.max((100 - result.finalHI) / 100, 0), 1);
    const hiFinalRotation = 180 * hiFinalPercentage;

    return (
        <div className="flex flex-col gap-6 animate-fade-in-up">
            
            {/* Top Cards: Main Indices */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* TDCG */}
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg">
                    <span className="text-xs text-slate-400 font-bold uppercase block mb-1">{t.tdcg}</span>
                    <span className="text-2xl font-mono text-white">{result.TDCG} <span className="text-sm text-slate-500">ppm</span></span>
                </div>
                {/* CO2/CO */}
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg">
                    <span className="text-xs text-slate-400 font-bold uppercase block mb-1">{t.ratioCO2CO}</span>
                    <span className="text-2xl font-mono text-white">{result.CO2_CO_Ratio}</span>
                </div>
                {/* HI (DGAF) */}
                <div className="bg-slate-800 p-4 rounded-xl border border-blue-500/30 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10">
                        <svg className="w-16 h-16 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" /></svg>
                    </div>
                    <span className="text-xs text-blue-400 font-bold uppercase block mb-1">{t.hiDgaf}</span>
                    <div className="flex items-baseline gap-2">
                         <span className={`text-3xl font-bold ${dgafCondition.color}`}>{result.HI_DGAF}</span>
                         <span className="text-xs text-slate-400">/ 1.0</span>
                    </div>
                    <span className={`text-sm font-medium ${dgafCondition.color} mt-1 block`}>{dgafCondition.text}</span>
                    <span className="text-[10px] text-slate-500 mt-1 block">DGAF: {result.DGAF}</span>
                </div>
                 {/* HI (FF) */}
                 <div className="bg-slate-800 p-4 rounded-xl border border-emerald-500/30 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10">
                        <svg className="w-16 h-16 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
                    </div>
                    <span className="text-xs text-emerald-400 font-bold uppercase block mb-1">{t.hiFf}</span>
                    <div className="flex items-baseline gap-2">
                         <span className={`text-3xl font-bold ${ffCondition.color}`}>{result.HI_FF}</span>
                         <span className="text-xs text-slate-400">/ 1.0</span>
                    </div>
                    <span className={`text-sm font-medium ${ffCondition.color} mt-1 block`}>{ffCondition.text}</span>
                    <span className="text-[10px] text-slate-500 mt-1 block">Fault: {result.gbdtFault}</span>
                </div>
            </div>
            
            {/* Extended Indices: LEDTF & PIF */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* LEDTF */}
                <div className="bg-slate-800 p-4 rounded-xl border border-orange-500/30 shadow-lg relative overflow-hidden flex flex-col justify-between">
                    <div>
                        <span className="text-xs text-orange-400 font-bold uppercase block mb-1">{t.ledtf}</span>
                        <div className="flex items-baseline gap-2">
                            <span className={`text-3xl font-bold ${ledtfCondition.color}`}>{result.LEDTF}</span>
                        </div>
                        <span className={`text-sm font-medium ${ledtfCondition.color} mt-1 block`}>{t.dischargeThermalStatus}</span>
                    </div>
                    <div className="mt-2 text-[10px] text-slate-500">
                        Calculated from vector magnitude of H2, CH4, CO
                    </div>
                </div>

                {/* PIF */}
                <div className="bg-slate-800 p-4 rounded-xl border border-purple-500/30 shadow-lg relative overflow-hidden">
                    <span className="text-xs text-purple-400 font-bold uppercase block mb-1">{t.pif}</span>
                    <div className="flex items-baseline gap-2">
                            <span className={`text-3xl font-bold ${pifCondition.color}`}>{result.PIF}</span>
                    </div>
                    <span className={`text-sm font-medium ${pifCondition.color} mt-1 block`}>{t.paperInsulationStatus}</span>
                    
                    <div className="flex gap-4 mt-3 pt-3 border-t border-slate-700/50">
                        <div>
                            <span className="text-[10px] text-slate-400 block">{t.pif1}</span>
                            <span className="text-lg font-mono text-white">{result.PIF1}</span>
                        </div>
                        <div>
                            <span className="text-[10px] text-slate-400 block">{t.pif2}</span>
                            <span className="text-lg font-mono text-white">{result.PIF2}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Middle Section: TWO GAUGES (HI Final & DGAF) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* 1. HI Final Gauge */}
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-yellow-500 to-red-500 opacity-50"></div>
                    <h3 className="text-lg font-bold text-white mb-2">{t.finalHiLabel}</h3>
                    
                    <div className="relative w-full h-[200px] flex justify-center">
                         {/* Half Donut */}
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={hiFinalGaugeData}
                                    cx="50%"
                                    cy="100%"
                                    startAngle={180}
                                    endAngle={0}
                                    innerRadius={80}
                                    outerRadius={120}
                                    paddingAngle={2}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {hiFinalGaugeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                            </PieChart>
                         </ResponsiveContainer>
                         {/* Needle */}
                         <div 
                            className="absolute bottom-0 w-[4px] h-[120px] bg-white origin-bottom rounded-full shadow-lg transition-transform duration-1000 ease-out"
                            style={{ 
                                transform: `rotate(${hiFinalRotation - 90}deg)`,
                                zIndex: 10
                            }}
                         >
                            <div className="absolute -bottom-2 -left-2 w-5 h-5 bg-white rounded-full border-4 border-slate-800"></div>
                         </div>
                         <div className="absolute bottom-10 text-center">
                             <span className={`text-5xl font-black ${finalCondColor}`}>{result.finalHI}</span>
                             <span className="block text-sm font-bold text-slate-300 mt-1">{finalCondText}</span>
                         </div>
                    </div>
                    <div className="flex justify-between w-full mt-4 text-xs font-bold text-slate-500 px-8">
                        <span className="text-emerald-500">Good (100)</span>
                        <span className="text-red-500">Poor (0)</span>
                    </div>
                </div>

                {/* 2. DGAF Gauge */}
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-yellow-500 to-red-500 opacity-50"></div>
                    <h3 className="text-lg font-bold text-white mb-2">{t.dgafScore}</h3>
                    
                    <div className="relative w-full h-[200px] flex justify-center">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={dgafGaugeData}
                                    cx="50%"
                                    cy="100%"
                                    startAngle={180}
                                    endAngle={0}
                                    innerRadius={80}
                                    outerRadius={120}
                                    paddingAngle={2}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {dgafGaugeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                            </PieChart>
                         </ResponsiveContainer>
                         {/* Needle */}
                         <div 
                            className="absolute bottom-0 w-[4px] h-[120px] bg-white origin-bottom rounded-full shadow-lg transition-transform duration-1000 ease-out"
                            style={{ 
                                transform: `rotate(${dgafRotation - 90}deg)`,
                                zIndex: 10
                            }}
                         >
                            <div className="absolute -bottom-2 -left-2 w-5 h-5 bg-white rounded-full border-4 border-slate-800"></div>
                         </div>
                         <div className="absolute bottom-10 text-center">
                             <span className="text-4xl font-bold text-white">{result.DGAF}</span>
                             <span className="block text-xs text-slate-400">Range: 1.0 - 6.0</span>
                         </div>
                    </div>
                    <div className="flex justify-between w-full mt-4 text-xs font-bold text-slate-500 px-8">
                        <span className="text-emerald-500">Good (1.0)</span>
                        <span className="text-red-500">Poor (6.0)</span>
                    </div>
                </div>

            </div>

            {/* Bottom Section: Calculation Table */}
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
                <h3 className="text-lg font-bold text-white mb-4">{t.calculationDetails}</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-300">
                        <thead className="text-xs text-slate-400 uppercase bg-slate-900/50">
                            <tr>
                                <th className="px-4 py-3 rounded-l-lg">{t.gasLabel}</th>
                                <th className="px-4 py-3">{t.valueLabel}</th>
                                <th className="px-4 py-3 text-center">{t.scoreLabel}</th>
                                <th className="px-4 py-3 text-center">{t.weightLabel}</th>
                                <th className="px-4 py-3 text-right rounded-r-lg">{t.weightedScoreLabel}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {result.details.map((row, index) => (
                                <tr key={index} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                                    <td className="px-4 py-3 font-medium text-white">{row.gas}</td>
                                    <td className="px-4 py-3">{row.value}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-2 py-1 rounded ${row.score > 4 ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-300'}`}>
                                            {row.score}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">{row.weight}</td>
                                    <td className="px-4 py-3 text-right font-mono text-emerald-400">{row.weightedScore}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-slate-700/30 font-bold text-white">
                            <tr>
                                <td colSpan={4} className="px-4 py-3 text-right uppercase text-xs tracking-wider">Total Weighted Score</td>
                                <td className="px-4 py-3 text-right font-mono text-lg">
                                    {result.details.reduce((a, b) => a + b.weightedScore, 0)}
                                </td>
                            </tr>
                            <tr>
                                <td colSpan={4} className="px-4 py-3 text-right uppercase text-xs tracking-wider">Total Weight</td>
                                <td className="px-4 py-3 text-right font-mono">
                                    {result.details.reduce((a, b) => a + b.weight, 0)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default HealthIndexView;
