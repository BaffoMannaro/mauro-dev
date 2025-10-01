import { NavLink } from 'react-router-dom';

export default function SidebarLink({ path, icon, label, open }) {
    return (
        <NavLink
            to={`/${path}`}
            className={({ isActive }) =>
                (isActive
                    ? 'text-gray-900  dark:text-slate-200'
                    : 'text-slate-300  dark:text-slate-500') +
                ' flex items-center p-2 rounded-lg'
            }
            end
        >
            <i className={`fal ${icon}`}></i>
            <span className={`ml-4 ${!open && 'hidden'}`}>{label}</span>
        </NavLink>
    );
}
