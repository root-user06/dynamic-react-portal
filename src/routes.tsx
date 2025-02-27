
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import Chat from './pages/Chat';
import Index from './pages/Index';
import Landing from './pages/Landing';
import NotFound from './pages/NotFound';
import { useAuth } from './context/AuthContext';
import { Loader2 } from 'lucide-react';

// Protected route wrapper
const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09122C] text-white">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="mt-4">Loading...</span>
        </div>
      </div>
    );
  }
  
  // Redirect to home page if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  // Render the child routes if authenticated
  return <Outlet />;
};

// Public route wrapper (redirect to chat if already authenticated)
const PublicRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Don't redirect while checking authentication
  if (isLoading) {
    return <Outlet />;
  }
  
  // Redirect to chat if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/chat" replace />;
  }
  
  // Render the child routes if not authenticated
  return <Outlet />;
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicRoute />,
    children: [
      {
        index: true,
        element: <Index />,
      },
    ],
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        path: '/chat',
        element: <Chat />,
      },
      {
        path: '/chat/:id',
        element: <Chat />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);
