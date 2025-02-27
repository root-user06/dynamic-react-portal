
import { ThemeProvider } from 'next-themes';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes.tsx';
import { Toaster } from './components/ui/toaster';
import { Toaster as SonnerToaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';

function App() {
  return (
    <ThemeProvider defaultTheme="light" attribute="class" enableSystem={false} disableTransitionOnChange>
      <AuthProvider>
        <ChatProvider>
          <RouterProvider router={router} />
          <Toaster />
          <SonnerToaster position="top-center" theme="light" />
        </ChatProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
