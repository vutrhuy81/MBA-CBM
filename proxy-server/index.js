const express = require('express');
const cors = require('cors');
const axios = require('axios');
const https = require('https'); // <--- QUAN TRỌNG: Thư viện để xử lý SSL
const app = express();
const PORT = 3000;

// 1. Cấu hình CORS: Cho phép tất cả nguồn truy cập
app.use(cors({ origin: '*' })); 
app.use(express.json());

const CPC_BASE_URL = 'https://smart.cpc.vn/ETCAPI';

// 2. Cấu hình HTTPS Agent: Bỏ qua lỗi chứng chỉ SSL (Fix lỗi kết nối)
const httpsAgent = new https.Agent({  
  rejectUnauthorized: false 
});

// Tạo một instance axios riêng dùng agent này
const axiosInstance = axios.create({
  httpsAgent: httpsAgent,
  timeout: 15000 // Tăng thời gian chờ lên 15 giây
});

// --- API Login ---
app.post('/proxy/login', async (req, res) => {
    console.log("--> [LOGIN] Bắt đầu gọi CPC...");
    try {
        const response = await axiosInstance.post(`${CPC_BASE_URL}/ETC/LoginWeb`, req.body, {
            headers: { 'Content-Type': 'application/json' }
        });
        console.log("--> [LOGIN] Thành công!");
        res.json(response.data);
    } catch (error) {
        console.error("--> [LOGIN] LỖI:");
        if (error.response) {
            // Server CPC trả về lỗi (VD: Sai pass, lỗi server 500)
            console.error("- Status:", error.response.status);
            console.error("- Data:", JSON.stringify(error.response.data));
            res.status(error.response.status).json(error.response.data);
        } else if (error.request) {
            // Không nhận được phản hồi (Lỗi mạng, timeout)
            console.error("- Không có phản hồi từ CPC (Network Error/Timeout)");
            res.status(503).json({ error: 'Không kết nối được tới Server CPC', details: error.message });
        } else {
            // Lỗi setup
            console.error("- Lỗi:", error.message);
            res.status(500).json({ error: 'Lỗi nội bộ Proxy', details: error.message });
        }
    }
});

// --- API Predict ---
app.post('/proxy/predict', async (req, res) => {
    console.log("--> [PREDICT] Bắt đầu gọi CPC...");
    try {
        const authHeader = req.headers['authorization'];
        
        // Kiểm tra xem có token gửi lên không
        if (!authHeader) {
            console.error("--> [PREDICT] Lỗi: Thiếu Token!");
            return res.status(401).json({ error: 'Thiếu Token gửi sang CPC' });
        }

        const response = await axiosInstance.post(`${CPC_BASE_URL}/ETC_AI/predict_Type`, req.body, {
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': authHeader 
            }
        });
        console.log("--> [PREDICT] Thành công!");
        res.json(response.data);
    } catch (error) {
        console.error("--> [PREDICT] LỖI:");
        if (error.response) {
            console.error("- Status:", error.response.status);
            console.error("- Data:", JSON.stringify(error.response.data));
            res.status(error.response.status).json(error.response.data);
        } else {
            console.error("- Lỗi kết nối:", error.message);
            res.status(500).json({ error: 'Lỗi khi gọi Predict CPC', details: error.message });
        }
    }
});

// Route kiểm tra sức khỏe server
app.get('/', (req, res) => {
    res.send('Server Proxy (v2 - Fix SSL) đang chạy ổn định!');
});

app.listen(PORT, () => {
    console.log(`Proxy Server đang chạy tại cổng ${PORT}`);
});


