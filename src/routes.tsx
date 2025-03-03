
import { createBrowserRouter } from "react-router-dom";
import Chat from "./pages/Chat";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import Landing from "./pages/Landing";
import Login from "./pages/login"; // Fixed casing to match the actual file name
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import UserList from "./pages/UserList";
import Profile from "./pages/Profile";

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
    path: "/",
    element: (
      <ProtectedRoute requireAuth={true}>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "chat",
        element: <Chat />,
      },
      {
        path: "chat/:id",
        element: <Chat />,
      },
      {
        path: "userlist",
        element: <UserList />,
      },
      {
        path: "profile",
        element: <Profile />,
      },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  }
]);
