
import { LogEntry } from "../types";

const LOG_STORAGE_KEY = "dga_app_logs";

export const addLog = (user: string, role: string, action: string, details: string) => {
  const logs = getLogs();
  const newLog: LogEntry = {
    id: Date.now().toString(),
    user,
    role,
    action,
    details,
    timestamp: new Date().toLocaleString('vi-VN'),
  };
  
  // Keep only the last 1000 logs to prevent storage issues
  const updatedLogs = [newLog, ...logs].slice(0, 1000);
  localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(updatedLogs));
};

export const getLogs = (): LogEntry[] => {
  const stored = localStorage.getItem(LOG_STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (e) {
    return [];
  }
};

export const clearLogs = () => {
  localStorage.removeItem(LOG_STORAGE_KEY);
};
