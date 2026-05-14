import  useAuthStore  from '../Stores/useAuthStore';
import axios from './axios';
import { jwtDecode } from 'jwt-decode';
import Cookies from 'js-cookie';

export const login = async (email, password) => {
    try {
        const { data, status } = await axios.post('token/', {
            email,
            password,
        });
        if (status === 200) {
            setAuthUser(data.access, data.refresh);
        }
        return { data, error: null };
    } catch (error) {
        return {
            data: null,
            error: error.response.data?.detail || 'Something went wrong',
        };
    }
};

export const register = async (
    email,
    first_name,
    last_name,
    password,
    password2
) => {
    try {
        const { data } = await axios.post('register/', {
            email,
            first_name,
            last_name,
            password,
            password2,
        });
        await login(email, password);
        return { data, error: null };
    } catch (error) {
        return {
            data: null,
            error: error.response.data || 'Something went wrong',
        };
    }
};

export const logout = () => {
    // Rimuovi con document.cookie per compatibilità con il resto del sistema
    document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    useAuthStore.getState().setUser(null);
};

export const setUser = async () => {
    // ON PAGE LOAD
    console.log('=== setUser() chiamato ===');
    console.log('document.cookie:', document.cookie);
    
    // Leggi i token da document.cookie (compatibile con useAuthStore)
    const accessToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('accessToken='))
        ?.split('=')[1];
    
    const refreshToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('refreshToken='))
        ?.split('=')[1];
    
    console.log('accessToken found:', accessToken ? 'YES' : 'NO');
    console.log('refreshToken found:', refreshToken ? 'YES' : 'NO');
    
    if (!refreshToken || !accessToken) {
        console.log('No tokens found, setting user to null');
        useAuthStore.getState().setUser(null);
        return;
    }

    if (isAccessTokenExpired(accessToken)) {
        console.log('Access token expired, refreshing...');
        try {
            const response = await getRefreshToken(refreshToken);
            setAuthUser(response.access, response.refresh);
        } catch (error) {
            console.error('Failed to refresh token:', error);
            useAuthStore.getState().setUser(null);
            return;
        }
    } else {
        console.log('Access token valid, setting auth user');
        setAuthUser(accessToken, refreshToken);
    }
    return true;
};

export const setAuthUser = (accessToken, refreshToken) => {
    console.log('=== setAuthUser() chiamato ===');
    // Usa document.cookie per compatibilità con useAxios e useAuthStore
    document.cookie = `accessToken=${accessToken}; path=/; max-age=${60 * 60 * 24}`; // 1 giorno
    document.cookie = `refreshToken=${refreshToken}; path=/; max-age=${60 * 60 * 24 * 7}`; // 7 giorni
    console.log('Cookies set, new document.cookie:', document.cookie);
    
    // Mantieni anche js-cookie per retrocompatibilità (senza secure su localhost)
    Cookies.set('accessToken', accessToken, {
        expires: 1,
    });

    Cookies.set('refreshToken', refreshToken, {
        expires: 7,
    });

    // Chiama setUser con l'accessToken (string) che lo store decodificherà internamente
    useAuthStore.getState().setUser(accessToken);
    console.log('User set in store');
};

export const getRefreshToken = async (refreshToken) => {
    const response = await axios.post('users/token/refresh/', {
        refresh: refreshToken,
    });

    console.log(response.data, 'refresh token response');
    return response.data; // returns {access: string, refresh: string}
};

export const isAccessTokenExpired = (accessToken) => {
    try {
        const decodedToken = jwtDecode(accessToken);
        return decodedToken.exp < Date.now() / 1000;
    } catch (err) {
        console.log('expired');
        return true; // Token is invalid or expired
    }
};

export const isRefreshTokenExpired = (refreshToken) => {
    try {
        const decodedToken = jwtDecode(refreshToken);
        return decodedToken.exp < Date.now() / 1000;
    } catch (err) {
        return true; // Token is invalid or expired
    }
};
