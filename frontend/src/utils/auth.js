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
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    useAuthStore.getState().setUser(null);
};

export const setUser = async () => {
    // ON PAGE LOAD

    const accessToken = Cookies.get('accessToken');
    const refreshToken = Cookies.get('refreshToken');
    if (!refreshToken) {
        /* useAuthStore.getState().setUser(null); */
        return;
    }

    if (isAccessTokenExpired(accessToken)) {
        const response = await getRefreshToken(refreshToken);
        setAuthUser(response.access, response.refresh);
    } else {
        setAuthUser(accessToken, refreshToken);
    }
    return true;
};

export const setAuthUser = (accessToken, refreshToken) => {
    Cookies.set('accessToken', accessToken, {
        expires: 1,
        secure: true,
    });

    Cookies.set('refreshToken', refreshToken, {
        expires: 7,
        secure: true,
    });

    const user = jwtDecode(accessToken) ?? null;

    if (user) {
        useAuthStore.getState().setUser(user);
    }
    useAuthStore.getState().setLoading(false);
};

export const getRefreshToken = async (refreshToken) => {
    const response = await axios.post('token/refresh/', {
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
