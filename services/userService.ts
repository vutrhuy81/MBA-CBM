// services/userService.ts
import { UserRole } from '../components/LoginPage';

const API_URL = "https://api-log.coolify.powertransformer.vn/api"; // Thay bằng domain thật của bạn

export interface User {
    _id?: string;
    username: string;
    password?: string;
    role: UserRole;
}

export const loginUser = async (username: string, password: string) => {
    const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');
    return data;
};

export const getUsers = async () => {
    const res = await fetch(`${API_URL}/users`);
    return await res.json();
};

export const createUser = async (user: User) => {
    const res = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to create');
    }
    return await res.json();
};

export const updateUser = async (id: string, user: Partial<User>) => {
    const res = await fetch(`${API_URL}/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
    });
    return await res.json();
};

export const deleteUser = async (id: string) => {
    await fetch(`${API_URL}/users/${id}`, { method: 'DELETE' });
};
