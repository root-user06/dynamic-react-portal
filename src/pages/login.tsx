
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '../lib/store';
import { Button } from "@/components/ui/button";
import { InputWithIcon } from "@/components/ui/input-with-icon";
import { motion } from 'framer-motion';
import { toast } from "@/components/ui/use-toast";
import { 
  loginWithEmail, 
  loginWithGoogle,
} from '../lib/firebase';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Mail, Lock, Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const Login = () => {
  const navigate = useNavigate();
  const { setCurrentUser, currentUser, lastActiveChatId, setSelectedUser, onlineUsers, setRememberMe, rememberMe } = useChatStore();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Email Auth States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  useEffect(() => {
    const handleRedirect = async () => {
      if (currentUser && lastActiveChatId && !isRedirecting) {
        setIsRedirecting(true);
        const lastActiveUser = onlineUsers.find(user => user.id === lastActiveChatId);
        if (lastActiveUser) {
          await setSelectedUser(lastActiveUser);
        }
        navigate('/chat', { replace: true });
      } else if (currentUser && !isRedirecting) {
        setIsRedirecting(true);
        navigate('/chat', { replace: true });
      }
    };

    handleRedirect();
  }, [currentUser, lastActiveChatId, navigate, onlineUsers, setSelectedUser, isRedirecting]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const user = await loginWithEmail(email, password);
      setCurrentUser(user);
      toast({
        title: "Success",
        description: "Logged in successfully!",
        className: "bg-green-50 border-green-200"
      });
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    
    try {
      const user = await loginWithGoogle();
      setCurrentUser(user);
      toast({
        title: "Success",
        description: "Logged in with Google successfully!",
        className: "bg-green-50 border-green-200"
      });
    } catch (error: any) {
      console.error('Google login error:', error);
      toast({
        title: "Authentication Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRememberMeChange = (checked: boolean) => {
    setRememberMe(checked);
  };

  if (isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-50">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Redirecting to your chats...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-black overflow-hidden">
      {/* Logo Section */}
      <div className="flex-1 flex flex-col items-center justify-between">
        {/* App Logo */}
        <div className="mt-16 text-center">
          <div className="flex justify-center items-center">
            <svg width="50" height="50" viewBox="0 0 589 558" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="100%" height="100%" fill="none" />
              <path d="M139.903 558H0.0643966C-3.16265 558 115.7 186 175.535 0H317.39L285.12 102.982C341.593 108.825 450.506 88.3743 467.986 184.052C486.81 249.055 408.151 325.743 381.259 325.743H589C588.328 345.463 571.789 386.51 511.013 392.937C450.237 399.364 327.027 395.615 273.019 392.937C234.629 391.034 232.764 341.504 235.731 340.969C230.151 338.474 276.519 325.604 285.12 316.979C314.701 299.45 330.836 263.662 328.82 230.065C328.82 188.435 278.397 167.254 264.951 172.366L139.903 558Z" fill="#46C8B6"/>
            </svg>
          </div>
        </div>

        {/* Auth Form Section */}
        <div className="flex-none w-full px-4 mb-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md mx-auto p-8 rounded-2xl bg-white shadow-lg"
          >
            <h1 className="text-3xl font-semibold text-center mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-600 text-center mb-8">
              Log in to continue chatting
            </p>

            <Tabs defaultValue="email" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email" className="text-sm">Email</TabsTrigger>
                <TabsTrigger value="google" className="text-sm">Google</TabsTrigger>
              </TabsList>

              <TabsContent value="email">
                <form onSubmit={handleEmailAuth} className="space-y-4">
                  <InputWithIcon
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border-gray-200"
                    icon={<Mail className="w-4 h-4 text-gray-500" />}
                    required
                    disabled={isLoading}
                  />
                  <InputWithIcon
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border-gray-200"
                    icon={<Lock className="w-4 h-4 text-gray-500" />}
                    required
                    disabled={isLoading}
                  />

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="remember" 
                      checked={rememberMe} 
                      onCheckedChange={handleRememberMeChange}
                    />
                    <Label htmlFor="remember" className="text-sm text-gray-600">
                      Remember me
                    </Label>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full py-6 bg-[#46C8B6] hover:bg-[#38a596] text-black font-semibold text-base rounded-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Logging in...
                      </div>
                    ) : (
                      'Log In'
                    )}
                  </Button>

                  <p className="text-center text-sm text-gray-600 mt-4">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => navigate('/auth/register')}
                      className="text-[#46C8B6] font-semibold hover:underline"
                      disabled={isLoading}
                    >
                      Sign Up
                    </button>
                  </p>
                </form>
              </TabsContent>

              <TabsContent value="google">
                <div className="space-y-4">
                  <p className="text-center text-sm text-gray-600 mb-4">
                    Continue with your Google account for a seamless experience
                  </p>
                  <Button 
                    onClick={handleGoogleAuth}
                    className="w-full py-6 border-[#46C8B6] text-[#46C8B6] bg-transparent hover:bg-[#46C8B6]/10 font-semibold text-base rounded-full flex items-center justify-center gap-2"
                    variant="outline"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Connecting to Google...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                        Continue with Google
                      </>
                    )}
                  </Button>
                  
                  <div className="flex items-center space-x-2 mt-4">
                    <Checkbox 
                      id="remember-google" 
                      checked={rememberMe} 
                      onCheckedChange={handleRememberMeChange}
                    />
                    <Label htmlFor="remember-google" className="text-sm text-gray-600">
                      Remember me
                    </Label>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 text-center text-gray-500 text-sm">
        <p>© {new Date().getFullYear()} PoudelX Chat. All rights reserved.</p>
      </div>
    </div>
  );
};

export default Login;
