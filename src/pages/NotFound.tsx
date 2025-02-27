
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

const NotFound = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#09122C] text-white p-6">
      <div className="text-center">
        <h1 className="text-7xl font-bold mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-6">Page Not Found</h2>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button 
          onClick={() => navigate(isAuthenticated ? '/chat' : '/')}
          className="bg-[#46C8B6] hover:bg-[#38a596] text-black"
        >
          Go to {isAuthenticated ? 'Chat' : 'Home'}
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
