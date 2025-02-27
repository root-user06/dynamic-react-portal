
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';

const Auth: React.FC = () => {
  const { login, register, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { mode = 'login' } = useParams<{ mode?: string }>();
  
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/chat');
    }
  }, [isAuthenticated, navigate]);
  
  const isRegisterMode = mode === 'register';
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isRegisterMode) {
        await register(name, email, password);
      } else {
        await login(email, password);
      }
      navigate('/chat');
    } catch (error) {
      console.error('Auth error:', error);
    }
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-[#1A5E63] text-white">
      {/* Header */}
      <div className="p-4 flex items-center">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate('/')}
          className="text-white"
        >
          <ArrowLeft />
        </Button>
        <h1 className="ml-2 text-xl font-semibold">
          {isRegisterMode ? 'Create Account' : 'Sign In'}
        </h1>
      </div>
      
      {/* Logo */}
      <div className="mt-4 mb-8 flex justify-center">
        <svg width="60" height="60" viewBox="0 0 589 558" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="none" />
          <path d="M139.903 558H0.0643966C-3.16265 558 115.7 186 175.535 0H317.39L285.12 102.982C341.593 108.825 450.506 88.3743 467.986 184.052C486.81 249.055 408.151 325.743 381.259 325.743H589C588.328 345.463 571.789 386.51 511.013 392.937C450.237 399.364 327.027 395.615 273.019 392.937C234.629 391.034 232.764 341.504 235.731 340.969C230.151 338.474 276.519 325.604 285.12 316.979C314.701 299.45 330.836 263.662 328.82 230.065C328.82 188.435 278.397 167.254 264.951 172.366L139.903 558Z" fill="#46C8B6"/>
        </svg>
      </div>
      
      {/* Form */}
      <div className="flex-1 flex flex-col justify-center px-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {isRegisterMode && (
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
                className="bg-[#333333] border-0 text-white"
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="bg-[#333333] border-0 text-white"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-white">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-[#333333] border-0 text-white pr-10"
              />
              <button 
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full py-6 bg-[#46C8B6] hover:bg-[#38a596] text-black rounded-full"
            disabled={isLoading}
          >
            {isLoading 
              ? (isRegisterMode ? 'Creating Account...' : 'Signing In...') 
              : (isRegisterMode ? 'Create Account' : 'Sign In')
            }
          </Button>
        </form>
        
        {/* Only show the account switch link in register mode */}
        {isRegisterMode && (
          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Already have an account?
              <Link
                to="/auth/login"
                className="ml-1 text-[#46C8B6] hover:underline"
              >
                Sign In
              </Link>
            </p>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="px-6 py-4 text-center">
        <p className="text-xs text-gray-500">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default Auth;
