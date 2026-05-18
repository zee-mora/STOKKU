import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;

export { isAxiosError, AxiosError } from 'axios';

const ClearAuthToken = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
};

const getAuthToken = () => {
    return localStorage.getItem('access_token');
};

const getUserData = () => {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
}


export { ClearAuthToken, getAuthToken, getUserData };