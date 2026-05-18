import React, { createContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

export interface NavigationItem {
    id: number;
    label: string;
    route: string | null;
    icon?: string | null;
    permission_slug?: string | null;
    permissions?: Array<{
        id: number;
        name: string;
        slug: string;
    }>;
    children?: NavigationItem[];
}

export interface UserData {
    id: number;
    name: string;
    email: string;
    role?: {
        id: number;
        name: string;
        slug: string;
    } | null;
    avatar?: string;
    permissions?: string[];
    menus?: NavigationItem[];
}

interface AuthContextType {
    user: UserData | null;
    token: string | null;
    isAuthenticated: boolean;
    loading: boolean;
    login: (userData: UserData, token: string) => void;
    logout: () => void;
    getToken: () => string | null;
    updateUser: (userData: UserData) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export { AuthContext };

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<UserData | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedToken = localStorage.getItem('access_token');
        const savedUser = localStorage.getItem('user_data');

        const bootstrap = async () => {
            if (savedToken && savedUser) {
                try {
                    const parsedUser = JSON.parse(savedUser) as UserData;
                    setToken(savedToken);
                    setUser(parsedUser);

                    const response = await api.get<{ user: UserData }>('/me');
                    const refreshedUser = response.data.user;

                    localStorage.setItem('user_data', JSON.stringify(refreshedUser));
                    setUser(refreshedUser);
                } catch (error) {
                    console.error('Failed to restore session:', error);
                    localStorage.clear();
                    setToken(null);
                    setUser(null);
                }
            }

            setLoading(false);
        };

        void bootstrap();
    }, []);

    const login = useCallback((userData: UserData, accessToken: string) => {
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('user_data', JSON.stringify(userData));
        setToken(accessToken);
        setUser(userData);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_data');
        setToken(null);
        setUser(null);
        window.location.href = '/login';
    }, []);

    const getToken = useCallback(() => {
        return localStorage.getItem('access_token');
    }, []);

    const updateUser = useCallback((userData: UserData) => {
        localStorage.setItem('user_data', JSON.stringify(userData));
        setUser(userData);
    }, []);

    const isAuthenticated = !!token && !!user;

    const value: AuthContextType = {
        user,
        token,
        isAuthenticated,
        loading,
        login,
        logout,
        getToken,
        updateUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};