
import { Navigate, useLocation } from 'react-router-dom';
import { useChatStore } from '@/lib/store';
import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation();
  const { currentUser, setCurrentUser, checkSession } = useChatStore();
  const [isLoading, setIsLoading] = useState(true);
  const auth = getAuth();

  useEffect(() => {
    // Check if we have a user in our storage
    const hasSession = checkSession();
    console.log("Session check in protected route:", hasSession);
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user && currentUser) {
        setCurrentUser(null);
      }
      setIsLoading(false);
    });

    // If we already have a session, don't wait for Firebase
    if (hasSession) {
      setIsLoading(false);
    }

    return () => unsubscribe();
  }, [auth, setCurrentUser, checkSession, currentUser]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#46C8B6]"></div>
    </div>;
  }

  if (!currentUser) {
    // Redirect to the landing page, but save the attempted location
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
