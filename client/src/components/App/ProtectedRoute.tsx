import React from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';

const ProtectedRoute: React.FC = () => {
    const navigate = useNavigate();
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

    if (!isLoggedIn) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;