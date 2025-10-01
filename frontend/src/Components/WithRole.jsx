import { useLocation, Navigate } from 'react-router-dom';
import useAuthStore from '../Stores/useAuthStore';

const WithRoles = ({ allowedRoles, children }) => {
    const user = useAuthStore((state) => state.user);

    const currentUser = user;
    const location = useLocation();

    return allowedRoles.find((role) => currentUser.groups.includes(role)) ? (
        children
    ) : currentUser?.user_id ? (
        <Navigate to="/404" state={{ from: location }} replace />
    ) : (
        <Navigate to="/login" state={{ from: location }} replace />
    );
};

export default WithRoles;
