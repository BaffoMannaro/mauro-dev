import React from 'react';
import useSidebarStore from '../Stores/sidebarStore';
import { useAuthStore } from '../Stores/auth';
import { useNavigate } from 'react-router';
import { logout } from '../utils/auth';
import Logo from './Atoms/Logo';

export default function Navbar({ open }) {
    return (
        <div
            className={
                'p-4 bg-primary-light-50 dark:bg-deep-space-2 border-b-4 border-deep-space-1 w-full flex justify-between items-center ' +
                (open ? 'pl-72' : 'pl-20')
            }
        >
            <p className="text-lg uppercase text-primary-light-900 dark:text-white">
                {import.meta.env.VITE_PROJECT_NAME}
            </p>
            {/* <div className="flex">
                <button onClick={logOut}>
                    <i className="fal fa-sign-out text-gray-900 dark:text-white"></i>
                </button>
            </div> */}
            <Logo />
        </div>
    );
}
