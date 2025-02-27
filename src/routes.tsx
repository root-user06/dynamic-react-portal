
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import Chat from './pages/Chat';
import Index from './pages/Index';
import Landing from './pages/Landing';
import NotFound from './pages/NotFound';
import Auth from './pages/Auth';
import { useAuth } from './context/AuthContext';

// Protected route wrapper component
const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    // Show loading state while checking authentication
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Redirect to landing page if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  // Render the children routes if authenticated
  return <Outlet />;
};

// Auth route wrapper component (redirects to app if already logged in)
const AuthRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    // Show loading state while checking authentication
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Redirect to chat if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }
  
  // Render landing page if not authenticated
  return <Outlet />;
};

export const router = createBrowserRouter([
  {
    // Public routes
    path: '/',
    element: <AuthRoute />,
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
    // Protected routes
    element: <ProtectedRoute />,
    children: [
      {
        path: '/home',
        element: <Index />,
      },
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
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);
