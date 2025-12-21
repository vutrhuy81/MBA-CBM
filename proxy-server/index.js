const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const PORT = 3000;

// --- PHẦN QUAN TRỌNG NHẤT: CẤU HÌNH CORS ---
// Dòng này cho phép Web của bạn (và mọi nơi khác) gọi vào Server này mà không bị chặn
app.use(cors({ origin: '*' })); 
app.use(express.json());

const CPC_BASE_URL = 'https://smart.cpc.vn/ETCAPI';

// API Login
app.post('/proxy/login', async (req, res) => {
    try {
        console.log("Đang gọi Login CPC...");
        const response = await axios.post(`${CPC_BASE_URL}/ETC/LoginWeb`, req.body, {
            headers: { 'Content-Type': 'application/json' }
        });
        res.json(response.data);
    } catch (error) {
        console.error("Lỗi Login:", error.message);
        res.status(500).json({ error: 'Lỗi kết nối CPC Login', details: error.message });
    }
});

// API Predict
app.post('/proxy/predict', async (req, res) => {
    try {
        console.log("Đang gọi Predict CPC...");
        const authHeader = req.headers['authorization'];
        const response = await axios.post(`${CPC_BASE_URL}/ETC_AI/predict_Type`, req.body, {
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': authHeader 
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error("Lỗi Predict:", error.message);
        res.status(500).json({ error: 'Lỗi kết nối CPC Predict', details: error.message });
    }
});

// Route kiểm tra server sống hay chết
app.get('/', (req, res) => {
    res.send('Server Proxy đang chạy ngon lành!');
});

app.listen(PORT, () => {
    console.log(`Proxy Server đang chạy tại cổng ${PORT}`);
});