import { Outlet } from 'react-router-dom';
import Sidebar from '../Components/Organism/Sidebar';
import useSidebarStore from '../Stores/sidebarStore';

export default function DashRoot() {
    /* const open = useSidebarStore((state) => state.open); */
    const open = true;
    return (
        <div className="bg-black">
            <aside
                className={`fixed top-0 left-0 z-30 ${
                    open ? 'w-64' : 'w-16'
                } h-screen transition-width `}
            >
                <Sidebar />
            </aside>
            <div
                className={` ${
                    open ? 'pl-64' : 'pl-16'
                } bg-primary-light-100 dark:bg-primary-dark-950  text-black dark:text-white antialiased min-h-screen transition-all`}
            >
                <div className="p-4 pt-20">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
