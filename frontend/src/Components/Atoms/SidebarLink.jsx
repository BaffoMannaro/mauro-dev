import { NavLink } from 'react-router-dom';

export default function SidebarLink({ path, label, open }) {
    return (
        <NavLink
            to={`/${path}`}
            className={({ isActive }) =>
                (isActive ? 'text-slate-700 opacity-25' : 'text-slate-700') +
                ' flex items-center p-2 rounded-lg'
            }
            end
        >
            <span className={`ml-4 ${!open && 'hidden'}`}>{label}</span>
        </NavLink>
    );
}
