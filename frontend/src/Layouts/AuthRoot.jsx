import { Outlet, ScrollRestoration } from 'react-router-dom';

import { Toaster } from 'react-hot-toast';

import { useEffect } from 'react';
import { logout, setUser } from '../utils/auth';

import useAuthStore from '../Stores/useAuthStore';
import GTMTracker from '../Components/GTMTracker';
/* import Navbar from '../Components/Navbar'; */

export default function AuthRoot() {
    const setIsLoading = useAuthStore((state) => state.setIsLoading);
    const isLoading = useAuthStore((state) => state.isLoading);

    useEffect(() => {
        const initAuth = async () => {
            console.log('AuthRoot initAuth - starting');

            // Verifica rememberMe
            if (localStorage.getItem('rememberMe') === 'false') {
                console.log('rememberMe is false, logging out');
                logout();
                setIsLoading(false);
                return;
            }

            // Carica lo stato dell'utente dai cookies
            try {
                const result = await setUser();
                console.log('setUser completed, result:', result);
                // setUser() chiama internamente setUser dello store che setta isLoading = false
            } catch (error) {
                console.error('Error setting user:', error);
                setIsLoading(false);
            }
        };

        // Esegui solo al mount iniziale
        initAuth();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return isLoading ? null : (
        <>
            <GTMTracker />
            <ScrollRestoration />
            <Toaster position="top-center" />
            <Outlet />
        </>
    );
}
