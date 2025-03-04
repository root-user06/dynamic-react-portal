import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useChatStore } from '../lib/store';
import { Button } from "@/components/ui/button";
import { InputWithIcon } from "@/components/ui/input-with-icon";
import { motion } from 'framer-motion';
import { toast } from "@/components/ui/use-toast";
import { loginWithEmail, loginWithGoogle, resetPassword } from '../lib/firebase';
import Loader from '@/components/Loader';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Mail, Lock, } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/userlist';
  
  const { setCurrentUser, currentUser, lastActiveChatId, setSelectedUser, onlineUsers } = useChatStore();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
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
        navigate(from, { replace: true });
      } else if (currentUser && !isRedirecting) {
        setIsRedirecting(true);
        navigate(from, { replace: true });
      }
    };
    handleRedirect();
  }, [currentUser, lastActiveChatId, navigate, onlineUsers, setSelectedUser, isRedirecting, from]);

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
          <Loader />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#ddecec] p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 rounded-2xl bg-white shadow-lg"
      >
        <h1 className="text-3xl font-semibold text-center mb-2">Login to Chat</h1>
        <p className="text-gray-600 text-center mb-8">Sign in to start chatting with your friends</p>

        <form onSubmit={handleEmailAuth} className="space-y-4">
          <InputWithIcon
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full"
            icon={<Mail className="w-4 h-4" />}
            required
            disabled={isLoading}
          />
          <InputWithIcon
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full"
            icon={<Lock className="w-4 h-4" />}
            required
            disabled={isLoading}
          />
          
          <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
            <DialogTrigger asChild>
              <button
                type="button"
                className="text-sm text-gray-600 hover:underline"
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
                  className="w-full"
                  icon={<Mail className="w-4 h-4" />}
                  required
                  disabled={isLoading}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader />
                      Sending Reset Link...
                    </div>
                  ) : 'Send Reset Link'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader />
                Signing In...
              </div>
            ) : 'Sign In'}
          </Button>

          <Button 
            onClick={handleGoogleAuth}
            className="w-full flex items-center justify-center gap-2"
            variant="outline"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader />
                Connecting to Google...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </>
            )}
          </Button>

          <p className="text-center text-sm text-gray-600 mt-4">
            Don't have an account?{' '}
            <a href="/auth/signup" className="text-black font-semibold hover:underline">
              Create Account
            </a>
          </p>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;
