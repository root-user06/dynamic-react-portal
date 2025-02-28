import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useChatStore } from '../lib/store';
import { Button } from "@/components/ui/button";
import { InputWithIcon } from "@/components/ui/input-with-icon";
import { motion } from 'framer-motion';
import { toast } from "@/components/ui/use-toast";
import { 
  loginWithEmail, 
  loginWithGoogle,
  resetPassword,
} from '../lib/firebase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Mail, Lock, Loader2 } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { setCurrentUser, currentUser, lastActiveChatId, setSelectedUser, onlineUsers } = useChatStore();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  
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


  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await resetPassword(resetEmail);
      setIsResetDialogOpen(false);
      toast({
        title: "Password Reset Email Sent",
        description: "Check your email for instructions to reset your password",
        className: "bg-green-50 border-green-200"
      });
      setResetEmail('');
    } catch (error: any) {
      toast({
        title: "Password Reset Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-50">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Redirecting...</span>
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
              Sign in to continue chatting
            </p>

            <Tabs defaultValue="email" className="space-y-6">
              <TabsList className="grid w-full grid-cols-1">
                <TabsTrigger value="email" className="text-sm">Sign In</TabsTrigger>
                
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

                  <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                    <DialogTrigger asChild>
                      <button
                        type="button"
                        className="text-sm text-[#46C8B6] hover:underline"
                        disabled={isLoading}
                      >
                        Forgot password?
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Reset Password</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handlePasswordReset} className="space-y-4 mt-4">
                        <InputWithIcon
                          type="email"
                          placeholder="Enter your email address"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          className="w-full rounded-xl border-gray-200"
                          icon={<Mail className="w-4 h-4 text-gray-500" />}
                          required
                          disabled={isLoading}
                        />
                        <Button 
                          type="submit" 
                          className="w-full py-6 bg-[#46C8B6] hover:bg-[#38a596] text-black font-semibold text-base rounded-full"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Sending Reset Link...
                            </div>
                          ) : (
                            'Send Reset Link'
                          )}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>

                  <Button 
                    type="submit" 
                    className="w-full py-6 bg-[#46C8B6] hover:bg-[#38a596] text-black font-semibold text-base rounded-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Signing In...
                      </div>
                    ) : (
                      'Sign In'
                    )}
                  </Button>

                  <p className="text-center text-sm text-gray-600 mt-4">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => navigate('/?register=true')}
                      className="text-[#46C8B6] font-semibold hover:underline"
                      disabled={isLoading}
                    >
                      Create Account
                    </button>
                  </p>
                </form>
              </TabsContent>

             
            </Tabs>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Login; 