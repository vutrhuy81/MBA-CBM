
import React from 'react';
import { Language } from '../types';
import { translations } from '../constants/translations';

interface ManualViewProps {
    lang: Language;
}

const ManualView: React.FC<ManualViewProps> = ({ lang }) => {
    const t = translations[lang];

    const steps = [
        { title: t.manualStep1, desc: t.manualStep1Desc, icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" },
        { title: t.manualStep2, desc: t.manualStep2Desc, icon: "M4 6h16M4 12h16M4 18h7" },
        { title: t.manualStep3, desc: t.manualStep3Desc, icon: "M13 10V3L4 14h7v7l9-11h-7z" },
    ];

    const funcs = [
        { title: t.func1Title, desc: t.func1Desc, color: "border-blue-500/30 text-blue-400" },
        { title: t.func2Title, desc: t.func2Desc, color: "border-emerald-500/30 text-emerald-400" },
        { title: t.func3Title, desc: t.func3Desc, color: "border-rose-500/30 text-rose-400" },
    ];

    return (
        <div className="flex flex-col gap-8 animate-fade-in-up">
            {/* Steps Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {steps.map((step, i) => (
                    <div key={i} className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg relative overflow-hidden group hover:border-blue-500/50 transition-all">
                        <div className="absolute -right-4 -top-4 text-slate-700/20 group-hover:text-blue-500/10 transition-colors">
                            <svg className="h-24 w-24" fill="currentColor" viewBox="0 0 24 24">
                                <path d={step.icon} />
                            </svg>
                        </div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold text-white shadow-lg">
                                {i + 1}
                            </div>
                            <h4 className="text-lg font-bold text-white">{step.title}</h4>
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed relative z-10">
                            {step.desc}
                        </p>
                    </div>
                ))}
            </div>

            {/* Functions Section */}
            <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-lg">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    {t.manualFunctions}
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {funcs.map((f, i) => (
                        <div key={i} className={`p-5 rounded-xl border ${f.color} bg-slate-900/30`}>
                            <h4 className="font-bold mb-2 uppercase text-xs tracking-wider">{f.title}</h4>
                            <p className="text-sm text-slate-300 leading-relaxed">
                                {f.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer Note */}
            <div className="text-center p-6 bg-blue-600/10 rounded-2xl border border-blue-500/20">
                <p className="text-sm text-blue-300">
                    {lang === 'vi' 
                        ? "Mọi thắc mắc kỹ thuật, vui lòng liên hệ bộ phận vận hành hoặc chuyên gia hệ thống." 
                        : "For any technical questions, please contact the operations department or system experts."}
                </p>
            </div>
        </div>
    );
};

export default ManualView;
