import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";

// Demo messages for the animated chat
const demoMessages = [
  { id: 1, text: "Welcome to PoudelX 👋", isUser: false },
  { id: 2, text: "PoudelX is engineered to protect your privacy.", isUser: true },
  { id: 3, text: "You don't even need a phone number to sign up.", isUser: false },
  { id: 4, text: "Creating an account is instant, free, and anonymous 👆", isUser: true },
  { id: 5, text: "Messages are end-to-end encrypted.", isUser: false },
  { id: 6, text: "Your data never leaves your device.", isUser: true },
  { id: 7, text: "Join thousands of users who value their privacy.", isUser: false },
  { id: 8, text: "Experience the future of secure messaging.", isUser: true }
];

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [visibleMessages, setVisibleMessages] = useState<typeof demoMessages>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Function to navigate to auth pages
  const goToCreateAccount = () => navigate('/auth/register');
  const goToSignIn = () => navigate('/auth/login');

  // Effect to manage the appearance of chat messages
  useEffect(() => {
    if (currentIndex >= demoMessages.length) {
      // Restart the loop after all messages are shown
      const timeout = setTimeout(() => {
        setVisibleMessages([]);
        setCurrentIndex(0);
      }, 2000); // Wait 2 seconds before restarting
      return () => clearTimeout(timeout);
    }

    // Add new message with delay
    const messageTimeout = setTimeout(() => {
      setVisibleMessages(prev => {
        // Keep maximum of 3 messages to avoid overflow (reduced from 4)
        if (prev.length >= 3) {
          return [...prev.slice(1), demoMessages[currentIndex]];
        }
        return [...prev, demoMessages[currentIndex]];
      });
      setCurrentIndex(prev => prev + 1);
    }, 3000); // Slow down the messages even more - show new one every 3 seconds

    return () => clearTimeout(messageTimeout);
  }, [currentIndex]);

  // Scroll to bottom when new messages appear
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [visibleMessages]);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const isRegisteringParam = queryParams.get('register');
    setIsRegistering(isRegisteringParam === 'true');
  }, [location.search]);

  return (
    <div className="min-h-screen flex flex-col bg-white text-black overflow-hidden">
      {/* Logo Section */}
      <div className="flex-1 flex flex-col items-center justify-between">
        {/* App Logo - just logo with no text */}
        <div className="mt-16 text-center">
          <div className="flex justify-center items-center">
            <svg width="50" height="50" viewBox="0 0 589 558" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="100%" height="100%" fill="none" />
              <path d="M139.903 558H0.0643966C-3.16265 558 115.7 186 175.535 0H317.39L285.12 102.982C341.593 108.825 450.506 88.3743 467.986 184.052C486.81 249.055 408.151 325.743 381.259 325.743H589C588.328 345.463 571.789 386.51 511.013 392.937C450.237 399.364 327.027 395.615 273.019 392.937C234.629 391.034 232.764 341.504 235.731 340.969C230.151 338.474 276.519 325.604 285.12 316.979C314.701 299.45 330.836 263.662 328.82 230.065C328.82 188.435 278.397 167.254 264.951 172.366L139.903 558Z" fill="#46C8B6"/>
            </svg>
          </div>
        </div>
        
        {/* Chat Demo Section - now in middle with height constraint */}
        <div className="flex-none w-full px-4 mb-4">
          <div 
            ref={chatContainerRef}
            className="max-w-sm mx-auto w-full h-[40vh] flex items-center justify-center"
          >
            <div className="w-full max-w-[250px]">
              <AnimatePresence mode="popLayout">
                {visibleMessages.map((message, index) => (
                  <motion.div
                    key={`${message.id}-${index}`}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={index === 0 ? { 
                      opacity: 0,
                      y: -50,
                      transition: { duration: 0.3, ease: "easeInOut" }
                    } : {
                      opacity: 0,
                      transition: { duration: 0.2 }
                    }}
                    transition={{ 
                      duration: 0.5,
                      type: "spring",
                      stiffness: 120,
                      damping: 10
                    }}
                    layout
                    className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} mb-3`}
                  >
                    <div 
                      className={`px-3 py-2 rounded-2xl max-w-[85%] ${
                        message.isUser 
                          ? 'bg-[#46C8B6] text-black rounded-br-none' 
                          : 'bg-[#333333] text-white rounded-bl-none'
                      }`}
                    >
                      <p className="text-xs">{message.text}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
        {/* Action Buttons - moved to bottom of flex container */}
        <div className="w-full px-6 pb-10 space-y-3">
          <Button 
            onClick={goToCreateAccount}
            className="w-full py-6 bg-[#46C8B6] hover:bg-[#38a596] text-black font-semibold text-base rounded-full"
          >
            Create account
          </Button>
          <Button 
            onClick={goToSignIn}
            variant="outline" 
            className="w-full py-6 border-[#46C8B6] text-[#46C8B6] bg-transparent hover:bg-[#46C8B6]/10 font-semibold text-base rounded-full"
          >
            I have an account
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Landing;