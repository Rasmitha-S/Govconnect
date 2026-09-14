import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { Role } from '../../types/index.js';

interface ProtectedRouteProps {
  allowedRoles?: Role[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gov-blue border-t-transparent mb-4"></div>
        <p className="text-sm font-medium text-gov-muted">Verifying secure credentials...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If citizen tries to access officer/admin or vice-versa, redirect to appropriate home
    const target = user.role === 'OFFICER' ? '/officer' : user.role === 'CENTRAL_ADMIN' ? '/admin' : '/citizen';
    return <Navigate to={target} replace />;
  }

  return <Outlet />;
};
