import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../Stores/useAuthStore';
import logoNavbar from '../assets/images/logo-navbar.png';

const NAV_LINKS = [
    { path: '/dashboard', label: 'Dashboard', end: true },
    { path: '/dashboard/articles', label: 'Articoli', end: false },
    { path: '/dashboard/categories', label: 'Categorie', end: false },
    { path: '/dashboard/tags', label: 'Tag', end: false },
];

export default function DashRoot() {
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const navigate = useNavigate();

    const handleLogout = async () => {
        navigate('/');
        logout();
    };

    return (
        <div className="font-noto min-h-screen bg-brand-bg">
            {/* Topbar */}
            <header className="fixed top-0 left-0 right-0 z-30 h-16 bg-white border-b border-brand-muted/40 flex items-center px-6 gap-8">
                <img src={logoNavbar} alt="Supero" className="h-7 object-contain" />

                <nav className="flex items-center gap-1 flex-1">
                    {NAV_LINKS.map(({ path, label, end }) => (
                        <NavLink
                            key={path}
                            to={path}
                            end={end}
                            className={({ isActive }) =>
                                `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                    isActive
                                        ? 'bg-brand-accent/10 text-brand-accent'
                                        : 'text-brand-dark/70 hover:text-brand-dark hover:bg-brand-muted/20'
                                }`
                            }
                        >
                            {label}
                        </NavLink>
                    ))}
                </nav>

                <div className="flex items-center gap-4">
                    {user && (
                        <span className="text-sm text-brand-dark/60 font-medium">
                            {user.username || user.email}
                        </span>
                    )}
                    <button
                        onClick={handleLogout}
                        className="text-sm font-medium text-brand-dark/60 hover:text-brand-accent transition-colors"
                    >
                        Esci
                    </button>
                </div>
            </header>

            {/* Page content */}
            <main className="pt-16">
                <div className="p-6 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
