import { createBrowserRouter } from "react-router-dom";
import Chat from "./pages/Chat";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Landing from "./pages/landing";
import Login from "./pages/Login";
export const router = createBrowserRouter([
  {
    path: "/",
    element: <Landing />,
  },
  {
    path: "/auth/signup",
    element: <Index />,
  },
  {
    path: "/auth/login",
    element: <Login />,
  },
  {
    path: "/chat",
    element: <Chat />,
  },
  {
    path: "/chat/:id",
    element: <Chat />,
  },
  {
    path: "/chat/profile",
    element: <Chat />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);
