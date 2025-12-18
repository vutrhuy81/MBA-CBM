
import React, { useState, useEffect } from 'react';
import { HealthIndexResult, Language } from '../types';
import { translations } from '../constants/translations';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { getHealthIndexConsultation } from '../services/geminiService';
import { UserRole } from './LoginPage';

interface HealthIndexViewProps {
    result: HealthIndexResult | null;
    lang: Language;
    role: UserRole;
}

const HealthIndexView: React.FC<HealthIndexViewProps> = ({ result, lang, role }) => {
    const [expertAdvice, setExpertAdvice] = useState<string | null>(null);
    const [loadingExpert, setLoadingExpert] = useState(false);
    
    const t = translations[lang];
    const isAdmin = role === 'Admin';

    useEffect(() => {
        setExpertAdvice(null);
    }, [result]);

    if (!result) return null;

    const handleAskExpert = async () => {
        if (!isAdmin) return;
        setLoadingExpert(true);
        try {
            const advice = await getHealthIndexConsultation(result, lang);
            setExpertAdvice(advice || "No response");
        } catch (e) {
            setExpertAdvice(lang === 'vi' ? "Không thể kết nối với Chuyên gia AI." : "Could not connect to AI Expert.");
        } finally {
            setLoadingExpert(false);
        }
    };

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

    const dgafGaugeData = [
        { name: 'Good', value: 1.2, color: '#10b981' },
        { name: 'Fair', value: 0.3, color: '#3b82f6' },
        { name: 'Poor', value: 1.0, color: '#facc15' },
        { name: 'Very Poor', value: 3.5, color: '#ef4444' },
    ];
    const dgafPercentage = Math.min(Math.max((result.DGAF - 1) / (6 - 1), 0), 1);
    const dgafRotation = 180 * dgafPercentage;

    const hiFinalGaugeData = [
        { name: 'Very Good', value: 15, color: '#10b981' },
        { name: 'Good', value: 15, color: '#3b82f6' },
        { name: 'Caution', value: 20, color: '#facc15' },
        { name: 'Poor', value: 20, color: '#f97316' },
        { name: 'Very Poor', value: 30, color: '#ef4444' },
    ];
    const hiFinalPercentage = Math.min(Math.max((100 - result.finalHI) / 100, 0), 1);
    const hiFinalRotation = 180 * hiFinalPercentage;

    return (
        <div className="flex flex-col gap-6 animate-fade-in-up">
            {/* Upper Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg">
                    <span className="text-xs text-slate-400 font-bold uppercase block mb-1">{t.tdcg}</span>
                    <span className="text-2xl font-mono text-white">{result.TDCG} <span className="text-sm text-slate-500">ppm</span></span>
                </div>
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg">
                    <span className="text-xs text-slate-400 font-bold uppercase block mb-1">{t.ratioCO2CO}</span>
                    <span className="text-2xl font-mono text-white">{result.CO2_CO_Ratio}</span>
                </div>
                <div className="bg-slate-800 p-4 rounded-xl border border-blue-500/30 shadow-lg relative overflow-hidden">
                    <span className="text-xs text-blue-400 font-bold uppercase block mb-1">{t.hiDgaf}</span>
                    <div className="flex items-baseline gap-2">
                         <span className={`text-3xl font-bold ${dgafCondition.color}`}>{result.HI_DGAF}</span>
                         <span className="text-xs text-slate-400">/ 1.0</span>
                    </div>
                    <span className={`text-sm font-medium ${dgafCondition.color} mt-1 block`}>{dgafCondition.text}</span>
                </div>
                 <div className="bg-slate-800 p-4 rounded-xl border border-emerald-500/30 shadow-lg relative overflow-hidden">
                    <span className="text-xs text-emerald-400 font-bold uppercase block mb-1">{t.hiFf}</span>
                    <div className="flex items-baseline gap-2">
                         <span className={`text-3xl font-bold ${ffCondition.color}`}>{result.HI_FF}</span>
                         <span className="text-xs text-slate-400">/ 1.0</span>
                    </div>
                    <span className={`text-sm font-medium ${ffCondition.color} mt-1 block`}>{ffCondition.text}</span>
                </div>
            </div>
            
            {/* Middle Indices Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-800 p-4 rounded-xl border border-orange-500/30 shadow-lg relative overflow-hidden">
                    <span className="text-xs text-orange-400 font-bold uppercase block mb-1">{t.ledtf}</span>
                    <div className="flex items-baseline gap-2">
                        <span className={`text-3xl font-bold ${ledtfCondition.color}`}>{result.LEDTF}</span>
                    </div>
                    <span className={`text-sm font-medium ${ledtfCondition.color} mt-1 block`}>{t.dischargeThermalStatus}</span>
                </div>

                <div className="bg-slate-800 p-4 rounded-xl border border-purple-500/30 shadow-lg relative overflow-hidden">
                    <span className="text-xs text-purple-400 font-bold uppercase block mb-1">{t.pif}</span>
                    <div className="flex items-baseline gap-2">
                            <span className={`text-3xl font-bold ${pifCondition.color}`}>{result.PIF}</span>
                    </div>
                    <span className={`text-sm font-medium ${pifCondition.color} mt-1 block`}>{t.paperInsulationStatus}</span>
                    <div className="flex gap-4 mt-3 pt-3 border-t border-slate-700/50">
                        <div><span className="text-[10px] text-slate-400 block">{t.pif1}</span><span className="text-lg font-mono text-white">{result.PIF1}</span></div>
                        <div><span className="text-[10px] text-slate-400 block">{t.pif2}</span><span className="text-lg font-mono text-white">{result.PIF2}</span></div>
                    </div>
                </div>
            </div>

            {/* Gauges Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg flex flex-col items-center justify-center relative overflow-hidden">
                    <h3 className="text-lg font-bold text-white mb-2">{t.finalHiLabel}</h3>
                    <div className="relative w-full h-[200px] flex justify-center">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={hiFinalGaugeData} cx="50%" cy="100%" startAngle={180} endAngle={0} innerRadius={80} outerRadius={120} paddingAngle={2} dataKey="value" stroke="none">
                                    {hiFinalGaugeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                            </PieChart>
                         </ResponsiveContainer>
                         <div className="absolute bottom-0 w-[4px] h-[120px] bg-white origin-bottom rounded-full shadow-lg transition-transform duration-1000 ease-out" style={{ transform: `rotate(${hiFinalRotation - 90}deg)`, zIndex: 10 }}>
                            <div className="absolute -bottom-2 -left-2 w-5 h-5 bg-white rounded-full border-4 border-slate-800"></div>
                         </div>
                         <div className="absolute bottom-10 text-center">
                             <span className={`text-5xl font-black ${finalCondColor}`}>{result.finalHI}</span>
                             <span className="block text-sm font-bold text-slate-300 mt-1">{finalCondText}</span>
                         </div>
                    </div>
                </div>

                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg flex flex-col items-center justify-center relative overflow-hidden">
                    <h3 className="text-lg font-bold text-white mb-2">{t.dgafScore}</h3>
                    <div className="relative w-full h-[200px] flex justify-center">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={dgafGaugeData} cx="50%" cy="100%" startAngle={180} endAngle={0} innerRadius={80} outerRadius={120} paddingAngle={2} dataKey="value" stroke="none">
                                    {dgafGaugeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                            </PieChart>
                         </ResponsiveContainer>
                         <div className="absolute bottom-0 w-[4px] h-[120px] bg-white origin-bottom rounded-full shadow-lg transition-transform duration-1000 ease-out" style={{ transform: `rotate(${dgafRotation - 90}deg)`, zIndex: 10 }}>
                            <div className="absolute -bottom-2 -left-2 w-5 h-5 bg-white rounded-full border-4 border-slate-800"></div>
                         </div>
                         <div className="absolute bottom-10 text-center">
                             <span className="text-4xl font-bold text-white">{result.DGAF}</span>
                         </div>
                    </div>
                </div>
            </div>

            {/* Calculations Table */}
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
                                    <td className="px-4 py-3 text-center"><span className={`px-2 py-1 rounded ${row.score > 4 ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-300'}`}>{row.score}</span></td>
                                    <td className="px-4 py-3 text-center">{row.weight}</td>
                                    <td className="px-4 py-3 text-right font-mono text-emerald-400">{row.weightedScore}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* EXPERT CONSULTATION SECTION - Hidden for Guests */}
            {isAdmin && (
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border border-rose-500/30 shadow-lg shadow-rose-500/5 mt-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-rose-400 flex items-center gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                            {t.hiExpertTitle}
                        </h3>
                    </div>

                    {!expertAdvice ? (
                        <div className="flex flex-col items-center justify-center p-8 bg-slate-900/30 rounded-xl border border-dashed border-slate-700">
                            <p className="text-slate-400 text-sm mb-6 text-center max-w-lg">
                                {t.hiExpertDisclaimer}
                            </p>
                            <button 
                                onClick={handleAskExpert}
                                disabled={loadingExpert}
                                className="px-8 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold transition-all shadow-xl hover:shadow-rose-500/20 active:scale-95 flex items-center gap-3"
                            >
                                {loadingExpert ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        {t.consulting}
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                        </svg>
                                        {t.askHiExpert}
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className="bg-slate-900/80 p-6 rounded-xl border border-slate-700 animate-fade-in shadow-inner max-h-[600px] overflow-y-auto custom-scrollbar">
                            <div className="prose prose-invert prose-sm max-w-none text-slate-300">
                                {expertAdvice.split('\n').map((line, i) => {
                                    const trimmed = line.trim();
                                    if (trimmed.startsWith('###')) {
                                        return <h3 key={i} className="text-rose-300 font-bold mt-6 mb-3 border-b border-rose-500/20 pb-1">{trimmed.replace('###', '')}</h3>;
                                    }
                                    if (trimmed.startsWith('##')) {
                                        return <h2 key={i} className="text-rose-200 font-bold mt-8 mb-4 text-lg">{trimmed.replace('##', '')}</h2>;
                                    }
                                    if (trimmed.startsWith('**')) {
                                        return <p key={i} className="font-bold text-slate-100 my-2">{trimmed.replace(/\*\*/g, '')}</p>;
                                    }
                                    if (trimmed.startsWith('-')) {
                                        return <li key={i} className="ml-6 mb-2 list-disc marker:text-rose-500">{trimmed.replace('-', '').trim()}</li>;
                                    }
                                    if (trimmed === '') {
                                        return <div key={i} className="h-2"></div>;
                                    }
                                    return <p key={i} className="mb-3 leading-relaxed">{trimmed}</p>;
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default HealthIndexView;
