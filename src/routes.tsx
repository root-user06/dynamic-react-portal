
import { createBrowserRouter } from "react-router-dom";
import Chat from "./pages/Chat";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Landing />,
  },
  {
    path: "/auth/signup",
    element: (
      <ProtectedRoute requireAuth={false}>
        <Signup />
      </ProtectedRoute>
    ),
  },
  {
    path: "/auth/login",
    element: (
      <ProtectedRoute requireAuth={false}>
        <Login />
      </ProtectedRoute>
    ),
  },
  {
    path: "/chat",
    element: (
      <ProtectedRoute requireAuth={true}>
        <Chat />
      </ProtectedRoute>
    ),
  },
  {
    path: "/chat/:id",
    element: (
      <ProtectedRoute requireAuth={true}>
        <Chat />
      </ProtectedRoute>
    ),
  },
  {
    path: "/chat/profile",
    element: (
      <ProtectedRoute requireAuth={true}>
        <Chat />
      </ProtectedRoute>
    ),
  },
  {
    path: "*",
    element: <NotFound />,
  }
]);
