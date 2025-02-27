
import { createBrowserRouter } from 'react-router-dom';
import Chat from './pages/Chat';
import Index from './pages/Index';
import Landing from './pages/Landing';
import NotFound from './pages/NotFound';
import Auth from './pages/Auth';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Landing />,
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
  {
    path: '/home',
    element: <Index />,
  },
  {
    path: '/auth',
    element: <Auth />,
  },
  {
    path: '/auth/:mode',
    element: <Auth />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);
