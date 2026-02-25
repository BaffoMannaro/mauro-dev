import { useState } from 'react';
import { Link } from 'react-router-dom';
import logoNavbar from '../../assets/images/logo-navbar.png';
import LanguageSwitcher from '../Atoms/LanguageSwitcher';
import useAuthStore from '../../Stores/useAuthStore';
import { useTranslation } from 'react-i18next';

export default function Navbar() {
    const user = useAuthStore((state) => state.user);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const { t } = useTranslation();

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const closeMenu = () => {
        setIsMenuOpen(false);
    };

    return (
        <div className="pt-5 absolute top-0 left-0 w-full z-[300]">
            <nav className="flex justify-between items-center px-2 xl:px-8 py-[10px] lg:py-6 bg-[rgba(46,46,51,0.2)] backdrop-blur-[25px] rounded-lg mx-4 xl:mx-8">
                {/* Logo */}
                <div className="flex items-center min-w-48">
                    <img
                        src={logoNavbar}
                        alt="Supero Logo"
                        className="h-8 ms-1 w-48"
                    />
                </div>

                {/* Desktop Navigation Menu */}
                <div className="hidden xl:flex items-center xl:space-x-8">
                    <LanguageSwitcher />
                    {user && (
                        <Link
                            to="/dashboard"
                            className="text-white hover:text-supero-green transition-all duration-200 font-medium text-[16px] uppercase"
                        >
                            DASHBOARD
                        </Link>
                    )}
                    <Link
                        to="/articles"
                        className="text-white hover:text-supero-green transition-all duration-200 font-medium text-[16px] uppercase ms-4"
                    >
                        {t('resources')}
                    </Link>
                    <span className="h-[24px] w-[2px] bg-white"></span>
                    <a
                        href="#landing-form"
                        className="bg-transparent text-white px-4 py-2 hover:text-supero-green transition-all duration-200 font-medium flex items-center text-[16px] group ms-4"
                    >
                        <span className="text-nowrap">GET A DEMO</span>
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="ms-3"
                        >
                            <path
                                d="M7.5 4.49995V5.99995H16.9425L4.5 18.4425L5.5575 19.5L18 7.05745V16.5H19.5V4.49995H7.5Z"
                                fill="white"
                                className="group-hover:fill-supero-green"
                            />
                        </svg>
                    </a>
                </div>

                {/* Mobile Hamburger Button */}
                <button
                    onClick={toggleMenu}
                    className="xl:hidden text-white p-2 focus:outline-none"
                    aria-label="Toggle menu"
                >
                    <svg
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M3 12H21M3 6H21M3 18H21"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </button>
            </nav>

            {/* Mobile Fullscreen Menu */}
            {isMenuOpen && (
                <div className="fixed inset-0 bg-[rgba(46,46,51,0.98)] backdrop-blur-[25px] z-[400] xl:hidden">
                    {/* Close Button */}
                    <button
                        onClick={closeMenu}
                        className="absolute top-8 right-8 text-white p-2 focus:outline-none"
                        aria-label="Close menu"
                    >
                        <svg
                            width="32"
                            height="32"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M18 6L6 18M6 6L18 18"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>

                    {/* Menu Content */}
                    <div className="flex flex-col items-center justify-center h-full space-y-8">
                        <LanguageSwitcher />

                        {user && (
                            <Link
                                to="/dashboard"
                                onClick={closeMenu}
                                className="text-white hover:text-supero-green transition-all duration-200 font-medium text-[24px] uppercase"
                            >
                                DASHBOARD
                            </Link>
                        )}

                        <Link
                            to="/articles"
                            onClick={closeMenu}
                            className="text-white hover:text-supero-green transition-all duration-200 font-medium text-[24px] uppercase"
                        >
                            {t('resources')}
                        </Link>

                        <a
                            href="#landing-form"
                            onClick={closeMenu}
                            className="bg-transparent text-white px-6 py-3 hover:text-supero-green transition-all duration-200 font-medium flex items-center text-[24px] group"
                        >
                            <span className="text-nowrap">GET A DEMO</span>
                            <svg
                                width="28"
                                height="28"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className="ms-3"
                            >
                                <path
                                    d="M7.5 4.49995V5.99995H16.9425L4.5 18.4425L5.5575 19.5L18 7.05745V16.5H19.5V4.49995H7.5Z"
                                    fill="white"
                                    className="group-hover:fill-supero-green"
                                />
                            </svg>
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}
