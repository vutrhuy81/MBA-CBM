
import React, { useState } from 'react';

interface LoginPageProps {
  onLogin: (username: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const validUsers: Record<string, string> = {
    'admin': '123456',
    'manager': '123456',
    'user1': '123456',
    'user2': '123456'
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validUsers[username] === password) {
      onLogin(username);
    } else {
      setError('Tên đăng nhập hoặc mật khẩu không chính xác!');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 font-sans">
      <div className="max-w-md w-full bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden animate-fade-in">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-center">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
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
              type="text" 
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-500"
              placeholder="Nhập username"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-400 block ml-1">Mật khẩu</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-500"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transform transition-all active:scale-95"
          >
            Đăng nhập
          </button>

          <div className="text-center pt-2">
            <p className="text-xs text-slate-500">
              © 2025 Power Transformer Diagnostics System by Vu Tran Huy
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;

