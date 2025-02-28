import { createBrowserRouter } from 'react-router-dom';
import Chat from './pages/Chat';
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import Landing from './pages/landing';
import Login from './pages/login';
import ProtectedRoute from './components/ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Landing />,
  },
  {
    path: '/auth/register',
    element: <Index />,
  },
  {
    path: '/auth/login',
    element: <Login />,
  },
  {
    path: '/chat',
    element: (
      <ProtectedRoute>
        <Chat />
      </ProtectedRoute>
    ),
  },
  {
    path: '/chat/:id',
    element: (
      <ProtectedRoute>
        <Chat />
      </ProtectedRoute>
    ),
  },
  {
    path: '/chat/profile',
    element: (
      <ProtectedRoute>
        <Chat />
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);
