import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '../lib/store';
import { Button } from "@/components/ui/button";
import { InputWithIcon } from "@/components/ui/input-with-icon";
import { motion } from 'framer-motion';
import { toast } from "@/components/ui/use-toast";
import { registerWithEmail, loginWithGoogle } from '../lib/firebase';
import { Mail, Lock, UserIcon, Loader2, Check, AlertTriangle, Info } from 'lucide-react';
import { getDatabase, ref, query, orderByChild, equalTo, get } from 'firebase/database';

const Signup = () => {
  const navigate = useNavigate();
  const { setCurrentUser, currentUser, lastActiveChatId, setSelectedUser, onlineUsers } = useChatStore();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordErrors, setPasswordErrors] = useState({
    length: true,
    uppercase: true,
    lowercase: true,
    number: true,
    special: true,
  });
  const [verificationSent, setVerificationSent] = useState(false);

  // Validate password strength
  const validatePassword = (value: string) => {
    setPasswordErrors({
      length: value.length < 8,
      uppercase: !/[A-Z]/.test(value),
      lowercase: !/[a-z]/.test(value),
      number: !/[0-9]/.test(value),
      special: !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value),
    });
  };

  // Validate email format
  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setEmailError(emailRegex.test(value) ? '' : 'Please enter a valid email address');
  };

  // Check if username exists (debounced)
  useEffect(() => {
    const checkUsername = async () => {
      if (name.length < 3) {
        setNameError('Username must be at least 3 characters');
        return;
      }
      
      setIsCheckingName(true);
      try {
        const db = getDatabase();
        const usersRef = ref(db, 'users');
        const nameQuery = query(usersRef, orderByChild('name'), equalTo(name));
        const snapshot = await get(nameQuery);
        
        if (snapshot.exists()) {
          setNameError('Username already exists');
        } else {
          setNameError('');
        }
      } catch (error) {
        console.error('Error checking username:', error);
      } finally {
        setIsCheckingName(false);
      }
    };

    const timer = setTimeout(() => {
      if (name.length >= 3) {
        checkUsername();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [name]);

  useEffect(() => {
    const handleRedirect = async () => {
      if (currentUser && !isRedirecting) {
        setIsRedirecting(true);
        
        // Redirect to verification page if email not verified
        if (!currentUser.emailVerified) {
          navigate('/email-verification', { replace: true });
          return;
        }
        
        // Otherwise redirect to normal flow
        if (lastActiveChatId) {
          const lastActiveUser = onlineUsers.find(user => user.id === lastActiveChatId);
          if (lastActiveUser) {
            await setSelectedUser(lastActiveUser);
          }
        }
        navigate('/userlist', { replace: true });
      }
    };
    handleRedirect();
  }, [currentUser, lastActiveChatId, navigate, onlineUsers, setSelectedUser, isRedirecting]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final validation before submission
    if (nameError || emailError || Object.values(passwordErrors).some(error => error)) {
      toast({
        title: "Validation Error",
        description: "Please fix all validation errors before submitting",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const user = await registerWithEmail(email, password, name);
      setCurrentUser(user);
      setVerificationSent(true);
      toast({
        title: "Success",
        description: "Account created successfully! Please verify your email.",
        className: "bg-green-50 border-green-200"
      });
      
      // Redirect to verification page after short delay
      setTimeout(() => {
        navigate('/email-verification', { replace: true });
      }, 1500);
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
    <div className="min-h-screen flex items-center justify-center bg-[#ddecec] p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 rounded-2xl bg-white shadow-lg"
      >
        {verificationSent ? (
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Mail className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-semibold">Verify Your Email</h1>
            <p className="text-gray-600">
              We've sent a verification link to <span className="font-medium">{email}</span>. 
              Please check your inbox and verify your email to continue.
            </p>
            <p className="text-gray-500 text-sm">
              Redirecting to verification page...
            </p>
            <div className="flex justify-center mt-2">
              <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-semibold text-center mb-2">Create Account</h1>
            <p className="text-gray-600 text-center mb-8">Sign up to start chatting with your friends</p>

            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div className="space-y-1">
                <InputWithIcon
                  type="text"
                  placeholder="Your username"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full ${nameError ? 'border-red-500' : ''}`}
                  icon={<UserIcon className="w-4 h-4" />}
                  required
                  disabled={isLoading}
                />
                {isCheckingName && (
                  <div className="text-sm text-gray-500 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Checking username...
                  </div>
                )}
                {nameError && (
                  <div className="text-sm text-red-500 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {nameError}
                  </div>
                )}
                {!nameError && name.length >= 3 && !isCheckingName && (
                  <div className="text-sm text-green-500 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Username available
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <InputWithIcon
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    validateEmail(e.target.value);
                  }}
                  className={`w-full ${emailError ? 'border-red-500' : ''}`}
                  icon={<Mail className="w-4 h-4" />}
                  required
                  disabled={isLoading}
                />
                {emailError && (
                  <div className="text-sm text-red-500 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {emailError}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <InputWithIcon
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    validatePassword(e.target.value);
                  }}
                  className={`w-full ${Object.values(passwordErrors).some(error => error) ? 'border-red-500' : ''}`}
                  icon={<Lock className="w-4 h-4" />}
                  required
                  disabled={isLoading}
                />
                
                <div className="mt-2 space-y-1 text-xs">
                  <p className="font-medium text-gray-700 flex items-center">
                    <Info className="w-3 h-3 mr-1" />
                    Password must:
                  </p>
                  <ul className="space-y-1 pl-5">
                    <li className={`flex items-center ${passwordErrors.length ? 'text-red-500' : 'text-green-500'}`}>
                      {passwordErrors.length ? <AlertTriangle className="w-3 h-3 mr-1" /> : <Check className="w-3 h-3 mr-1" />}
                      Be at least 8 characters
                    </li>
                    <li className={`flex items-center ${passwordErrors.uppercase ? 'text-red-500' : 'text-green-500'}`}>
                      {passwordErrors.uppercase ? <AlertTriangle className="w-3 h-3 mr-1" /> : <Check className="w-3 h-3 mr-1" />}
                      Include uppercase letter
                    </li>
                    <li className={`flex items-center ${passwordErrors.lowercase ? 'text-red-500' : 'text-green-500'}`}>
                      {passwordErrors.lowercase ? <AlertTriangle className="w-3 h-3 mr-1" /> : <Check className="w-3 h-3 mr-1" />}
                      Include lowercase letter
                    </li>
                    <li className={`flex items-center ${passwordErrors.number ? 'text-red-500' : 'text-green-500'}`}>
                      {passwordErrors.number ? <AlertTriangle className="w-3 h-3 mr-1" /> : <Check className="w-3 h-3 mr-1" />}
                      Include number
                    </li>
                    <li className={`flex items-center ${passwordErrors.special ? 'text-red-500' : 'text-green-500'}`}>
                      {passwordErrors.special ? <AlertTriangle className="w-3 h-3 mr-1" /> : <Check className="w-3 h-3 mr-1" />}
                      Include special character
                    </li>
                  </ul>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || !!nameError || !!emailError || Object.values(passwordErrors).some(error => error)}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating Account...
                  </div>
                ) : 'Create Account'}
              </Button>

              <Button 
                onClick={handleGoogleAuth}
                className="w-full flex items-center justify-center gap-2"
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
                Already have an account?{' '}
                <a href="/auth/login" className="text-black font-semibold hover:underline">
                  Sign In
                </a>
              </p>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default Signup;
