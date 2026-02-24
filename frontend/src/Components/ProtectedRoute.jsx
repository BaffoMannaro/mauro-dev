import { useLocation, Navigate } from 'react-router-dom';
import useAuthStore from '../Stores/useAuthStore';

const ProtectedRoute = ({ children }) => {
    const user = useAuthStore((state) => state.user);
    const isLoading = useAuthStore((state) => state.isLoading);
    const location = useLocation();

    // Mostra un loading mentre il persist rehydrata lo stato
    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-xl">Caricamento...</div>
            </div>
        );
    }

    return user?.user_id ? (
        children
    ) : (
        <Navigate to="/login" state={{ from: location }} replace />
    );
};

export default ProtectedRoute;
