import { Outlet, ScrollRestoration } from 'react-router-dom';

import { Toaster } from 'react-hot-toast';

import { useEffect, useState } from 'react';
import { logout, setUser } from '../utils/auth';

import useAuthStore from '../Stores/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import useSidebarStore from '../Stores/sidebarStore';
/* import Navbar from '../Components/Navbar'; */

export default function AuthRoot() {
    const user = useAuthStore((state) => state.user);
    let location = useLocation();

    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (localStorage.getItem('rememberMe') === 'false') {
            logout();
            navigate('/');
        }
    }, []);

    useEffect(() => {
        const handler = async () => {
            setLoading(true);
            await setUser();
            setLoading(false);
        };
        handler();

        if (!user) {
            if (
                location.pathname.includes('reset-password') ||
                location.pathname.includes('forgot-password') ||
                location.pathname.includes('complete-registration') ||
                location.pathname.includes('register') ||
                location.pathname.includes('login') ||
                location.pathname.includes('check-your-email') ||
                location.pathname.includes('confirm-email-change') ||
                location.pathname.includes('thank-you-page') ||
                location.pathname.includes('comunicato-stampa-rebranding')
            ) {
                //pass
            } else {
                navigate('/');
            }
        }
    }, []);

    return loading ? null : (
        <>
            <ScrollRestoration />
            <Toaster position="top-center" />
            <Outlet />
        </>
    );
}
