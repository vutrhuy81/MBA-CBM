const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
//========================================
require('dotenv').config();
//========================================

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

//==============================================================
// --- 2. SCHEMA USER (Thêm mới) ---
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Lưu ý: Dự án thực tế nên mã hóa bằng bcrypt
    role: { type: String, enum: ['Admin', 'Guest'], default: 'Guest' },
    createdAt: { type: Date, default: Date.now }
});
const UserModel = mongoose.model('User', UserSchema);

// --- HÀM TẠO ADMIN MẶC ĐỊNH ---
const initDefaultAdmin = async () => {
    try {
        const count = await UserModel.countDocuments({ role: 'Admin' });
        if (count === 0) {
            await UserModel.create({
                username: 'admin',
                password: '123456', // Mật khẩu mặc định
                role: 'Admin'
            });
            console.log("⚡ Đã tạo tài khoản admin mặc định: admin / 123456");
        }
    } catch (e) {
        console.error("Lỗi tạo admin:", e);
    }
};
//==============================================================
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
//================================================================
// API: Xóa log
app.delete('/api/logs', async (req, res) => {
    try {
        await LogModel.deleteMany({});
        res.json({ message: "Deleted all logs" });
    } catch (error) { res.status(500).json({ error: error.message }); }
});
//================================================================
// ================= API USER (Thêm mới) =================

// 1. Đăng nhập
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await UserModel.findOne({ username });
        if (user && user.password === password) {
            res.json({ success: true, username: user.username, role: user.role });
        } else {
            res.status(401).json({ success: false, message: "Sai tên đăng nhập hoặc mật khẩu" });
        }
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// 2. Lấy danh sách User (Chỉ Admin mới thấy - Frontend sẽ lo việc ẩn hiện, Backend trả data)
app.get('/api/users', async (req, res) => {
    try {
        const users = await UserModel.find().sort({ createdAt: -1 });
        res.json(users);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// 3. Tạo User mới
app.post('/api/users', async (req, res) => {
    try {
        const { username, password, role } = req.body;
        // Kiểm tra trùng
        const exist = await UserModel.findOne({ username });
        if (exist) return res.status(400).json({ message: "Username đã tồn tại" });

        const newUser = new UserModel({ username, password, role });
        await newUser.save();
        res.status(201).json(newUser);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// 4. Sửa User (Đổi pass hoặc quyền)
app.put('/api/users/:id', async (req, res) => {
    try {
        const { password, role } = req.body;
        const updateData = { role };
        if (password) updateData.password = password; // Chỉ cập nhật pass nếu có gửi lên

        const updatedUser = await UserModel.findByIdAndUpdate(req.params.id, updateData, { new: true });
        res.json(updatedUser);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// 5. Xóa User
app.delete('/api/users/:id', async (req, res) => {
    try {
        await UserModel.findByIdAndDelete(req.params.id);
        res.json({ message: "User deleted" });
    } catch (error) { res.status(500).json({ error: error.message }); }
});
//=============================================================================


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
