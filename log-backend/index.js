const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors()); // Cho phép Frontend gọi vào

// Kết nối MongoDB từ biến môi trường
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/logs';
mongoose.connect(MONGO_URL)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ DB Error:', err));

// Định nghĩa cấu trúc Log
const LogSchema = new mongoose.Schema({
    user: String,
    role: String,
    action: String,
    details: String,
    timestamp: { type: Date, default: Date.now }
});
const LogModel = mongoose.model('Log', LogSchema);

// API: Nhận Log từ Frontend (POST)
app.post('/api/logs', async (req, res) => {
    try {
        const newLog = new LogModel(req.body);
        await newLog.save();
        res.status(201).json(newLog);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API: Xem danh sách Log (GET)
app.get('/api/logs', async (req, res) => {
    try {
        const logs = await LogModel.find().sort({ timestamp: -1 }).limit(100);
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));