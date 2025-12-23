// Thay dòng này bằng link domain Backend bạn lấy ở Phần 3
// Lưu ý: Phải có /api/logs ở cuối
const API_URL = "https://log-backend-xxxx.coolify.yourdomain.com/api/logs";

export interface LogEntry {
  _id?: string;
  user: string;
  role: string;
  action: string;
  details: string;
  timestamp: string;
}

export const addLog = async (user: string, role: string, action: string, details: string) => {
  try {
    const logData = { user, role, action, details };
    
    // Gửi data sang Backend
    await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(logData),
    });
    // console.log("Log sent to DB");
  } catch (error) {
    console.error("Failed to save log:", error);
  }
};

export const getLogs = async (): Promise<LogEntry[]> => {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("Network response was not ok");
    
    const data = await res.json();
    
    // Format lại dữ liệu cho đẹp
    return data.map((item: any) => ({
      ...item,
      timestamp: new Date(item.timestamp).toLocaleString('vi-VN')
    }));
  } catch (error) {
    console.error("Error fetching logs:", error);
    return [];
  }
};
