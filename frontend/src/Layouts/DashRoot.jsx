import { Outlet } from 'react-router-dom';
import Sidebar from '../Components/Organism/Sidebar';

export default function DashRoot() {
    return (
        <div className="bg-white">
            <aside
                className={`fixed top-0 left-0 z-30 w-72 h-screen overflow-hidden `}
            >
                <Sidebar />
            </aside>
            <div
                className={`pl-72 text-black antialiased min-h-screen transition-all`}
            >
                <div className="p-4 pt-20">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
