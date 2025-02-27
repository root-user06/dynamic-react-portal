
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import Chat from './pages/Chat';
import Index from './pages/Index';
import Landing from './pages/Landing';
import NotFound from './pages/NotFound';
import Auth from './pages/Auth';
import { useAuth } from './context/AuthContext';

// Protected route wrapper
const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Show loading while checking authentication
  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#09122C] text-white">
      <div className="animate-spin h-8 w-8 border-t-2 border-white rounded-full"></div>
    </div>;
  }
  
  // Redirect to auth page if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
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
        element: <Landing />,
      },
      {
        path: '/auth',
        element: <Auth />,
      },
      {
        path: '/auth/:mode',
        element: <Auth />,
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
      {
        path: '/chat/profile',
        element: <Chat />,
      },
      {
        path: '/home',
        element: <Index />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);
