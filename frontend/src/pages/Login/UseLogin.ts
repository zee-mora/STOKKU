// src/pages/Login/useLogin.ts
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { showToast } from '../../utils/alert';
import api, { isAxiosError } from '../../api/axios';

import type { LoginResponse } from './types';
import type { ToastStatus } from '../../types/types';

export const useLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const navigate = useNavigate();
    const { login: authLogin } = useAuth();

    const getDefaultRoute = (menus?: { route?: string | null; children?: { route?: string | null; children?: unknown[] }[] }[]) => {
        const walk = (items?: { route?: string | null; children?: { route?: string | null; children?: unknown[] }[] }[]): string | null => {
            for (const item of items ?? []) {
                if (item.route) {
                    return item.route;
                }

                const childRoute = walk(item.children as { route?: string | null; children?: { route?: string | null; children?: unknown[] }[] }[]);
                if (childRoute) {
                    return childRoute;
                }
            }

            return null;
        };

        return walk(menus) ?? '/admin/users';
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await api.post<LoginResponse>('/login', {
                email,
                password
            });

            const { message, access_token, user, status = 'success' } = response.data;
            
            authLogin(user, access_token);
            showToast(status as ToastStatus || 'success', message || 'Login berhasil!', 'Selamat datang kembali!');
            
            if (status === 'success') {
                navigate(getDefaultRoute(user.menus));
            }
        } catch (err) {
            let errorMessage = 'Login gagal. Silakan coba lagi.';
            
            if (isAxiosError(err)) {
                errorMessage = err.response?.data?.message || errorMessage;
            }
            
            showToast('error', 'Login Gagal', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleShowPasswordToggle = () => setShowPassword(!showPassword);

    return {
        email,
        setEmail,
        password,
        setPassword,
        loading,
        showPassword,
        handleLogin,
        handleShowPasswordToggle,
    };
};