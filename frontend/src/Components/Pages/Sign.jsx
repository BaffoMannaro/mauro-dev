import { useEffect, useState } from 'react';

import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../Stores/useAuthStore';
import LoginForm from '../Organism/LoginForm';
import RegisterForm from '../Organism/RegisterForm';

import LogoImage from '../../assets/images/logo-dark.svg';
const Sign = () => {
    const navigate = useNavigate();

    const [view, setView] = useState('login');

    const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

    useEffect(() => {
        if (isLoggedIn()) {
            navigate('/dashboard');
        }
    });

    return (
        <div className="min-h-screen pt-24 bg-deep-space-2 flex flex-col items-center justify-center">
            <div className="mb-12">
                <img src={LogoImage} alt="" />
            </div>
            {/*             <ThemeSwitcher /> */}
            {view === 'login' ? <LoginForm /> : <RegisterForm />}

            {view === 'login' ? (
                <p
                    className="cursor-pointer text-white mt-12"
                    onClick={() => setView('register')}
                >
                    New user?{' '}
                </p>
            ) : (
                <p
                    className="cursor-pointer text-white mt-12"
                    onClick={() => setView('login')}
                >
                    Already registered?
                </p>
            )}

            <Link to="/forgot-password" className="text-white">
                Forgot password?
            </Link>
        </div>
    );
};

export default Sign;
