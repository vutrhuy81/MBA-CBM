
import React, { useState, useEffect } from 'react';
import { Language, LogEntry } from '../types';
import { translations } from '../constants/translations';
import { getLogs, clearLogs } from '../services/loggingService';

interface LogViewProps {
  lang: Language;
}

const LogView: React.FC<LogViewProps> = ({ lang }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const t = translations[lang];

  useEffect(() => {
    setLogs(getLogs());
  }, []);

  const handleClear = () => {
    if (window.confirm(lang === 'vi' ? 'Bạn có chắc chắn muốn xóa toàn bộ nhật ký?' : 'Are you sure you want to clear all logs?')) {
      clearLogs();
      setLogs([]);
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes(t.actionLogin)) return "text-blue-400";
    if (action.includes(t.actionGemini)) return "text-indigo-400";
    if (action.includes(t.actionProposed)) return "text-emerald-400";
    if (action.includes(t.actionHealth)) return "text-rose-400";
    if (action.includes(t.actionExpert)) return "text-purple-400";
    return "text-slate-400";
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      <div className="flex justify-between items-center bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-md">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
           </svg>
           {t.logsTab} ({logs.length})
        </h3>
        {logs.length > 0 && (
          <button 
            onClick={handleClear}
            className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors uppercase border border-red-400/30 px-3 py-1.5 rounded-lg hover:bg-red-400/10"
          >
            {t.logClear}
          </button>
        )}
      </div>

      <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 italic">
            {t.logNoData}
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
            <table className="w-full text-sm text-left text-slate-300">
              <thead className="text-xs text-slate-400 uppercase bg-slate-900/50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4">{t.logTime}</th>
                  <th className="px-6 py-4">{t.logUser}</th>
                  <th className="px-6 py-4">{t.logAction}</th>
                  <th className="px-6 py-4">{t.logDetails}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-slate-500">{log.timestamp}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <div className="flex flex-col">
                          <span className="font-bold text-white">{log.user}</span>
                          <span className="text-[10px] text-slate-500 uppercase">{log.role}</span>
                       </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap font-bold ${getActionColor(log.action)}`}>
                      {log.action}
                    </td>
                    <td className="px-6 py-4 text-xs max-w-xs truncate" title={log.details}>
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogView;
