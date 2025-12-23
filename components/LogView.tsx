import React, { useState, useEffect } from 'react';
import { Language, LogEntry } from '../types';
import { translations } from '../constants/translations';
import { getLogs, clearLogs } from '../services/loggingService';

interface LogViewProps {
  lang: Language;
}

const LogView: React.FC<LogViewProps> = ({ lang }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true); // Thêm trạng thái loading
  const t = translations[lang];

  // --- SỬA LỖI 1: Gọi hàm async đúng cách ---
  const fetchLogsData = async () => {
    setLoading(true);
    try {
      const data = await getLogs();
      setLogs(data);
    } catch (error) {
      console.error("Failed to load logs", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogsData();
  }, []);

  const handleClear = async () => {
    if (window.confirm(lang === 'vi' ? 'Bạn có chắc chắn muốn xóa toàn bộ nhật ký?' : 'Are you sure you want to clear all logs?')) {
      await clearLogs();
      // Sau khi xóa trên server, cập nhật lại state rỗng
      setLogs([]); 
    }
  };
  
  // Hàm refresh thủ công
  const handleRefresh = () => {
      fetchLogsData();
  };

  const handleExportExcel = () => {
    if (logs.length === 0) return;

    const BOM = "\uFEFF";
    const headers = [t.logTime, t.logUser, "Role", t.logAction, t.logDetails];
    
    const escape = (val: string) => `"${(val || "").replace(/"/g, '""')}"`;
    
    const rows = logs.map(log => [
      escape(log.timestamp),
      escape(log.user),
      escape(log.role),
      escape(log.action),
      escape(log.details)
    ]);

    const csvContent = BOM + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `nhat_ky_he_thong_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActionColor = (action: string) => {
    if (!action) return "text-slate-400";
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
        <div className="flex items-center gap-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            {t.logsTab} ({logs.length})
            </h3>
            {/* Nút Refresh */}
            <button onClick={handleRefresh} title="Làm mới" className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition">
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
            </button>
        </div>
        
        <div className="flex gap-2">
          {logs.length > 0 && (
            <>
              <button 
                onClick={handleExportExcel}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors uppercase border border-emerald-400/30 px-3 py-1.5 rounded-lg hover:bg-emerald-400/10 flex items-center gap-1.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {t.logExport}
              </button>
              <button 
                onClick={handleClear}
                className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors uppercase border border-red-400/30 px-3 py-1.5 rounded-lg hover:bg-red-400/10 flex items-center gap-1.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {t.logClear}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
        {loading ? (
            <div className="p-12 text-center text-slate-400">
                <p>Đang tải dữ liệu...</p>
            </div>
        ) : logs.length === 0 ? (
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
                {logs.map((log, index) => (
                  // SỬA LỖI 2: Dùng log.id (đã map từ _id) hoặc index làm fallback
                  <tr key={log.id || index} className="hover:bg-slate-700/30 transition-colors">
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
                    <td className="px-6 py-4 text-xs max-w-md whitespace-pre-wrap leading-relaxed" title={log.details}>
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
