import React, { useState, useEffect } from 'react';
import { User, getUsers, createUser, updateUser, deleteUser } from '../services/userService';
import { UserRole } from './LoginPage';

const UserManagementView: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Form State
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState<string | null>(null);
    const [formUser, setFormUser] = useState<User>({ username: '', password: '', role: 'Guest' });

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await getUsers();
            setUsers(data);
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditing && currentId) {
                // Update
                const updateData: any = { role: formUser.role };
                if (formUser.password) updateData.password = formUser.password;
                await updateUser(currentId, updateData);
            } else {
                // Create
                if (!formUser.password) return alert("Vui lòng nhập mật khẩu");
                await createUser(formUser);
            }
            resetForm();
            fetchUsers();
        } catch (error: any) {
            alert(error.message);
        }
    };

    const handleEdit = (user: User) => {
        setIsEditing(true);
        setCurrentId(user._id || null);
        setFormUser({ username: user.username, password: '', role: user.role }); // Password để trống nếu không đổi
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa user này?")) {
            await deleteUser(id);
            fetchUsers();
        }
    };

    const resetForm = () => {
        setIsEditing(false);
        setCurrentId(null);
        setFormUser({ username: '', password: '', role: 'Guest' });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up">
            {/* Form - Bên trái */}
            <div className="lg:col-span-1 bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg h-fit">
                <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-700 pb-2">
                    {isEditing ? 'Cập nhật User' : 'Thêm User mới'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs text-slate-400 uppercase font-bold">Username</label>
                        <input 
                            type="text" required disabled={isEditing}
                            value={formUser.username}
                            onChange={e => setFormUser({...formUser, username: e.target.value})}
                            className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 mt-1 disabled:opacity-50"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 uppercase font-bold">
                            {isEditing ? 'Mật khẩu mới (Để trống nếu không đổi)' : 'Mật khẩu'}
                        </label>
                        <input 
                            type="password" 
                            required={!isEditing}
                            value={formUser.password}
                            onChange={e => setFormUser({...formUser, password: e.target.value})}
                            className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 mt-1"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 uppercase font-bold">Phân quyền (Role)</label>
                        <select 
                            value={formUser.role}
                            onChange={e => setFormUser({...formUser, role: e.target.value as UserRole})}
                            className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 mt-1"
                        >
                            <option value="Guest">Guest (Chỉ xem)</option>
                            <option value="Admin">Admin (Toàn quyền)</option>
                        </select>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                        <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg font-bold transition">
                            {isEditing ? 'Lưu thay đổi' : 'Tạo mới'}
                        </button>
                        {isEditing && (
                            <button type="button" onClick={resetForm} className="px-4 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600">
                                Hủy
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* List - Bên phải */}
            <div className="lg:col-span-2 bg-slate-800 rounded-2xl border border-slate-700 shadow-lg overflow-hidden">
                <div className="p-4 bg-slate-900/50 border-b border-slate-700 flex justify-between items-center">
                    <h3 className="font-bold text-white">Danh sách người dùng ({users.length})</h3>
                    <button onClick={fetchUsers} className="text-xs bg-slate-700 px-3 py-1 rounded text-slate-300 hover:text-white">Làm mới</button>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-300">
                        <thead className="text-xs text-slate-400 uppercase bg-slate-900">
                            <tr>
                                <th className="px-6 py-3">Username</th>
                                <th className="px-6 py-3">Role</th>
                                <th className="px-6 py-3 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {loading ? (
                                <tr><td colSpan={3} className="p-4 text-center">Đang tải...</td></tr>
                            ) : users.map((u: any) => (
                                <tr key={u._id} className="hover:bg-slate-700/30">
                                    <td className="px-6 py-3 font-bold text-white">{u.username}</td>
                                    <td className="px-6 py-3">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'Admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-600/20 text-slate-400'}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-right space-x-2">
                                        <button onClick={() => handleEdit(u)} className="text-blue-400 hover:text-blue-300 font-medium">Sửa</button>
                                        {u.username !== 'admin' && ( // Không cho xóa admin gốc
                                            <button onClick={() => handleDelete(u._id)} className="text-red-400 hover:text-red-300 font-medium">Xóa</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UserManagementView;
