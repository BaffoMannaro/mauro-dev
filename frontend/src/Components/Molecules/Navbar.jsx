import React from 'react';
import { Link } from 'react-router-dom';
import logoNavbar from '../../assets/images/logo-navbar.png';
import LanguageSwitcher from '../Atoms/LanguageSwitcher';
import useAuthStore from '../../Stores/useAuthStore';

export default function Navbar() {
    const user = useAuthStore((state) => state.user);

    return (
        <div className=" pt-5 absolute top-0 left-0 w-full z-[300]">
            <nav className="flex justify-between items-center px-2 xl:px-8 py-[10px] lg:py-6 bg-[rgba(46,46,51,0.2)] backdrop-blur-[25px] rounded-lg mx-4 xl:mx-8">
                {/* Logo */}
                <div className="flex items-center  min-w-48">
                    <img
                        src={logoNavbar}
                        alt="Supero Logo"
                        className="h-8 ms-1 w-48"
                    />
                </div>

                {/* Navigation Menu */}
                <div className="flex items-center xl:space-x-8 ">
                    <LanguageSwitcher />
                    {user && (
                        <Link
                            to="/dashboard"
                            className="text-white hover:text-supero-green transition-all duration-200 font-medium text-[14px] xl:text-[16px] uppercase"
                        >
                            DASHBOARD
                        </Link>
                    )}
                    <Link
                        to="/articles"
                        className="text-white hover:text-supero-green transition-all duration-200 font-medium text-[14px] xl:text-[16px] uppercase hidden xl:block ms-4"
                    >
                        Articles
                    </Link>
                    <span className="hidden xl:block h-[24px] w-[2px] bg-white"></span>
                    <a
                        href="#landing-form"
                        className="bg-transparent text-white xl:px-4 py-2 hover:text-supero-green transition-all duration-200 font-medium flex items-center text-[14px] xl:text-[16px] group ms-4"
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
                                className=" group-hover:fill-supero-green"
                            />
                        </svg>
                    </a>
                </div>
            </nav>
        </div>
    );
}
