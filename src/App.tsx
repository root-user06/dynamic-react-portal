
import { ThemeProvider } from 'next-themes';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes.tsx';
import { Toaster } from './components/ui/toaster';
import { useEffect } from 'react';

function App() {
  // Add global error handler
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', event.error);
      // Prevent the app from completely crashing on non-fatal errors
      event.preventDefault();
    };

    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  return (
    <ThemeProvider defaultTheme="light" attribute="class" enableSystem={false} disableTransitionOnChange>
      <RouterProvider router={router} />
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
