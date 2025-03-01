
import { Navigate, useLocation } from 'react-router-dom';
import { useChatStore } from '@/lib/store';
import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import Loader from '@/components/ui/loader';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation();
  const { currentUser, setCurrentUser, checkSession } = useChatStore();
  const [isLoading, setIsLoading] = useState(true);
  const auth = getAuth();

  useEffect(() => {
    // Check if we have a user in our storage first
    const hasSession = checkSession();
    
    // Set up Firebase auth state listener
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user && currentUser) {
        // Firebase says user is logged out but our store thinks they're logged in
        // This is an edge case where we need to clear our store
        setCurrentUser(null);
      }
      
      // Always set loading to false once we've checked auth
      setIsLoading(false);
    }, (error) => {
      // Handle any Firebase auth errors
      console.error("Firebase auth error:", error);
      setIsLoading(false);
    });

    // If we already have a session, don't wait too long for Firebase
    if (hasSession) {
      // Set a timeout to ensure we don't wait forever if Firebase is slow
      const timeout = setTimeout(() => {
        setIsLoading(false);
      }, 2000);
      
      return () => {
        clearTimeout(timeout);
        unsubscribe();
      };
    }

    return () => unsubscribe();
  }, [auth, setCurrentUser, checkSession, currentUser]);

  // Show loader while checking authentication
  if (isLoading) {
    return <Loader />;
  }

  // If no user is authenticated, redirect to login
  if (!currentUser) {
    // Redirect to the landing page, but save the attempted location
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // User is authenticated, render children
  return <>{children}</>;
};

export default ProtectedRoute;
