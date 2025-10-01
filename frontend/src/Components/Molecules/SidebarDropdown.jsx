import { useState } from 'react';

export default function SidebarDropdown({ icon, label, open, children }) {
    const [show, setShow] = useState(false);
    return (
        <>
            <div
                className="flex items-center p-2 rounded-lg text-slate-300  dark:text-slate-500 cursor-pointer"
                onClick={() => setShow(!show)}
            >
                <i className={`fal ${icon}`}></i>
                <span className={`ml-4 ${!open && 'hidden'}`}>
                    {label}{' '}
                    <i
                        className={`fal fa-chevron-${show ? 'up' : 'down'} ml-10`}
                    ></i>
                </span>
            </div>
            <ul className={`${open ? 'pl-4' : ''} ${show ? '' : 'hidden'}`}>
                {children}
            </ul>
        </>
    );
}
