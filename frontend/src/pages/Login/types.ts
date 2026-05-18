import type { UserData } from '../../context/AuthContext';

export interface LoginResponse {
    status: string;
    message: string;
    access_token: string;
    user: UserData;
}

export interface LoginErrorResponse {
    message: string;
    errors?: {
        email?: string[];
        password?: string[];
    }
}