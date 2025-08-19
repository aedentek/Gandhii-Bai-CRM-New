import React from 'react';
import { Navigate } from 'react-router-dom';
import { getUserPermissions, isRouteAccessible } from '@/utils/permissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredPath }) => {
  const userPermissionsData = getUserPermissions();
  const currentPath = requiredPath || window.location.pathname;
  
  // Check if user has access to this route
  const hasAccess = isRouteAccessible(currentPath, userPermissionsData.permissions, userPermissionsData.role);
  
  if (!hasAccess) {
    // Redirect to dashboard or show unauthorized page
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

export default ProtectedRoute;
