
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '../lib/store';
import { Button } from "@/components/ui/button";
import { motion } from 'framer-motion';
import { toast } from "@/components/ui/use-toast";
import { resendVerificationEmail } from '../lib/firebase';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { Mail, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';

const EmailVerification = () => {
  const navigate = useNavigate();
  const { currentUser, setCurrentUser } = useChatStore();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [verified, setVerified] = useState(false);
  
  useEffect(() => {
    const auth = getAuth();
    let unsubscribe: (() => void) | undefined;
    
    // Check if user is already verified and redirect if needed
    const checkVerification = async () => {
      unsubscribe = onAuthStateChanged(auth, (user) => {
        setLoading(false);
        
        if (!user) {
          // No user is signed in, redirect to login
          navigate('/auth/login', { replace: true });
          return;
        }
        
        // Force refresh to get latest token
        user.reload().then(() => {
          if (user.emailVerified) {
            // Update store with verified status
            if (currentUser) {
              setCurrentUser({
                ...currentUser,
                emailVerified: true
              });
            }
            setVerified(true);
            
            // Automatically redirect after a short delay
            setTimeout(() => {
              navigate('/userlist', { replace: true });
            }, 2000);
          }
        });
      });
    };
    
    checkVerification();
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [navigate, currentUser, setCurrentUser]);

  const handleResendEmail = async () => {
    setSending(true);
    try {
      await resendVerificationEmail();
      toast({
        title: "Verification Email Sent",
        description: "Please check your inbox for the verification link",
        className: "bg-green-50 border-green-200"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const handleBackToSignup = () => {
    navigate('/auth/signup', { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#ddecec]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-[#46C8B6]" />
          <p className="text-gray-600">Checking verification status...</p>
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
        {verified ? (
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-semibold">Email Verified!</h1>
            <p className="text-gray-600">
              Your email has been successfully verified. Redirecting you to the application...
            </p>
          </div>
        ) : (
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-semibold">Verify Your Email</h1>
            <p className="text-gray-600">
              We've sent a verification link to <span className="font-medium">{currentUser?.email}</span>. 
              Please check your inbox and verify your email to continue.
            </p>
            <p className="text-gray-500 text-sm">
              You won't be able to access the application until your email is verified.
            </p>
            <Button 
              onClick={handleResendEmail} 
              variant="outline" 
              className="mt-6"
              disabled={sending}
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Sending...
                </>
              ) : 'Resend Verification Email'}
            </Button>
            <div className="pt-4 border-t mt-6 flex flex-col space-y-3">
              <Button 
                onClick={handleBackToSignup} 
                variant="ghost" 
                className="flex items-center justify-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Create Account
              </Button>
              <a href="/auth/login" className="text-black font-semibold hover:underline">
                Return to Login
              </a>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default EmailVerification;
