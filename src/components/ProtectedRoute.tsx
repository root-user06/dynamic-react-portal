
import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useChatStore } from '@/lib/store';
import Loader from './Loader';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  requireVerification?: boolean;
}

const ProtectedRoute = ({ children, requireAuth = true, requireVerification = false }: ProtectedRouteProps) => {
  const { currentUser } = useChatStore();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Check both the store and storage for user authentication
    const checkAuth = () => {
      const sessionUser = sessionStorage.getItem('currentUser');
      const cookieUser = document.cookie
        .split('; ')
        .find(row => row.startsWith('currentUser='));
        
      // If we have a user in the store or in storage, they're authenticated
      const isAuthenticated = !!(currentUser?.id || sessionUser || cookieUser);
      
      setIsLoading(false);
      return isAuthenticated;
    };
    
    // Short timeout to ensure store is fully loaded
    const timer = setTimeout(() => {
      checkAuth();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [currentUser]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader />
        </div>
      </div>
    );
  }
  
  const isAuthenticated = !!(currentUser && currentUser.id);
  const isVerified = !!(currentUser && currentUser.emailVerified);
  
  if (requireAuth && !isAuthenticated) {
    // Redirect to landing page if auth is required but user isn't authenticated
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  
  if (!requireAuth && isAuthenticated) {
    // Redirect to chat if auth is not required (login/signup pages) but user is already authenticated
    return <Navigate to="/userlist" replace />;
  }
  
  // Check email verification if required
  if (requireVerification && isAuthenticated && !isVerified) {
    // User is logged in but email not verified, redirect to verification page
    // Don't redirect if already on verification page
    if (!location.pathname.includes('/email-verification')) {
      return <Navigate to="/email-verification" replace />;
    }
  }
  
  return <>{children}</>;
};

export default ProtectedRoute;
