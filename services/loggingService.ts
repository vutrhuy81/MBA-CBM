import { LogEntry } from '../types'; 
// Nếu file ../types chưa có LogEntry, hãy bỏ dòng trên và dùng interface bên dưới
// Nhưng tốt nhất là import từ types để đồng bộ.

// Cấu hình URL API (Backend Coolify của bạn)
const API_URL = "https://api-log.coolify.powertransformer.vn/api/logs";

// Interface nội bộ cho kết quả trả về từ Mongo
interface MongoLogEntry {
  _id: string;
  user: string;
  role: string;
  action: string;
  details: string;
  timestamp: string;
}

export const addLog = async (user: string, role: string, action: string, details: string) => {
  try {
    const logData = { user, role, action, details };
    await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(logData),
    });
  } catch (error) {
    console.error("Failed to save log:", error);
  }
};

export const getLogs = async (): Promise<LogEntry[]> => {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("Network response was not ok");
    
    const data: MongoLogEntry[] = await res.json();
    
    // Map _id của Mongo sang id của Frontend & Format ngày tháng
    return data.map((item) => ({
      id: item._id, // Quan trọng: Map _id sang id để dùng làm key trong React
      user: item.user,
      role: item.role,
      action: item.action,
      details: item.details,
      timestamp: new Date(item.timestamp).toLocaleString('vi-VN')
    })) as unknown as LogEntry[]; 
  } catch (error) {
    console.error("Error fetching logs:", error);
    return [];
  }
};

// --- QUAN TRỌNG: Hàm này giúp sửa lỗi Build trên Vercel ---
export const clearLogs = async () => {
  try {
    // Gọi API xóa (Backend cần hỗ trợ method DELETE)
    await fetch(API_URL, {
      method: "DELETE",
    });
  } catch (error) {
    console.error("Failed to clear logs:", error);
  }
};
