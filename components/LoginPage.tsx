import React, { useState } from 'react';
import { loginUser } from '../services/userService'; // Import service mới

export type UserRole = 'Admin' | 'Guest';

interface LoginPageProps {
  onLogin: (username: string, role: UserRole) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
        // Gọi API login
        const data = await loginUser(username, password);
        if (data.success) {
            onLogin(data.username, data.role);
        }
    } catch (err: any) {
        setError(err.message || 'Đăng nhập thất bại');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 font-sans text-slate-200">
      <div className="max-w-md w-full bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden animate-fade-in">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-center">
            {/* ... Giữ nguyên phần Header logo ... */}
            <h2 className="text-2xl font-bold text-white tracking-tight">DGA Transformer</h2>
            <p className="text-blue-100 text-sm mt-1">Hệ thống đánh giá tình trạng máy biến áp</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl text-sm font-medium animate-shake text-center">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-400 block ml-1">Tên đăng nhập</label>
            <input 
              type="text" required value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="admin"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-400 block ml-1">Mật khẩu</label>
            <input 
              type="password" required value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
          >
            {loading ? 'Đang kiểm tra...' : 'Đăng nhập'}
          </button>
          
          <p className="text-xs text-center text-slate-500 mt-4">
              *Mặc định lần đầu: admin / 123456
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
