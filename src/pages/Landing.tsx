
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from 'framer-motion';

const Landing = () => {
  const navigate = useNavigate();
  const [visibleChats, setVisibleChats] = useState<number[]>([0, 1, 2, 3]);

  // Dummy chat data
  const dummyChats = [
    { id: 0, name: "Sarah", message: "Hey, how's your project going?" },
    { id: 1, name: "John", message: "Did you check out the new design?" },
    { id: 2, name: "Mike", message: "Meeting at 3pm tomorrow?" },
    { id: 3, name: "Anna", message: "Thanks for your help yesterday!" },
    { id: 4, name: "Tom", message: "Can you send me that file please?" },
    { id: 5, name: "Lisa", message: "I finished the task you assigned!" },
    { id: 6, name: "David", message: "Let's catch up soon!" },
    { id: 7, name: "Emily", message: "The new PoudelX Chat app looks amazing!" },
  ];

  // Animation to cycle through chats
  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleChats(prev => {
        const newChats = [...prev];
        // Remove first chat and add next one
        newChats.shift();
        const nextChatId = (prev[prev.length - 1] + 1) % dummyChats.length;
        newChats.push(nextChatId);
        return newChats;
      });
    }, 2500); // Faster animation cycle
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-[#F8F9FF] text-black overflow-y-auto">
      {/* Logo Section */}
      <div className="flex-1 flex flex-col items-center justify-start pt-12 md:pt-24 px-4">
        {/* App Logo */}
        <div className="mb-8 text-center">
          <motion.div 
            className="flex justify-center items-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <svg width="100" height="100" viewBox="0 0 589 558" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="100%" height="100%" fill="none" />
              <path d="M139.903 558H0.0643966C-3.16265 558 115.7 186 175.535 0H317.39L285.12 102.982C341.593 108.825 450.506 88.3743 467.986 184.052C486.81 249.055 408.151 325.743 381.259 325.743H589C588.328 345.463 571.789 386.51 511.013 392.937C450.237 399.364 327.027 395.615 273.019 392.937C234.629 391.034 232.764 341.504 235.731 340.969C230.151 338.474 276.519 325.604 285.12 316.979C314.701 299.45 330.836 263.662 328.82 230.065C328.82 188.435 278.397 167.254 264.951 172.366L139.903 558Z" fill="#46C8B6"/>
            </svg>
          </motion.div>
          <motion.h1 
            className="text-5xl font-bold mt-4 bg-gradient-to-r from-[#46C8B6] to-[#8B5CF6] bg-clip-text text-transparent"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            PoudelX Chat
          </motion.h1>
          <motion.p 
            className="text-gray-600 mt-2"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Developed by Santosh Poudel
          </motion.p>
        </div>

        {/* Dummy Chat Boxes */}
        <div className="w-full max-w-md mx-auto mb-12 px-4 relative h-[350px]">
          <AnimatePresence mode="popLayout">
            {visibleChats.map((chatId, index) => (
              <motion.div
                key={`${chatId}-${index}`}
                initial={{ opacity: 0, y: 40, scale: 0.9 }}
                animate={{ 
                  opacity: 1, 
                  y: index * 24, 
                  scale: 1 - (index * 0.03),
                  zIndex: visibleChats.length - index 
                }}
                exit={{ opacity: 0, y: -60, scale: 0.8 }}
                transition={{ duration: 0.4, type: "spring", bounce: 0.2 }}
                className={`absolute w-full left-0 rounded-2xl shadow-md p-4 ${
                  index === 0 
                    ? 'bg-gradient-to-r from-[#46C8B6]/10 to-[#8B5CF6]/10 border border-[#46C8B6]/20' 
                    : 'bg-white border border-gray-100'
                }`}
                style={{ 
                  top: 0,
                  opacity: 1 - (index * 0.15)
                }}
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-[#46C8B6]/10 flex items-center justify-center text-[#46C8B6] flex-shrink-0 text-lg font-semibold">
                    {dummyChats[chatId].name[0]}
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="font-medium">{dummyChats[chatId].name}</p>
                    <p className="text-sm text-gray-600 truncate">{dummyChats[chatId].message}</p>
                  </div>
                  <div className="text-xs text-gray-400 flex-shrink-0">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Website Developer Info */}
        <motion.div 
          className="text-center mb-8 bg-white p-6 rounded-xl shadow-sm max-w-md mx-auto border border-gray-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h3 className="text-lg font-medium text-[#46C8B6] mb-2">About PoudelX Chat</h3>
          <p className="text-gray-600">
            A modern messaging application designed for seamless communication,
            developed with care by Santosh Poudel.
          </p>
          <p className="text-gray-600 mt-2">
            Connect with friends and colleagues instantly in a beautiful, intuitive interface!
          </p>
        </motion.div>

        {/* Auth Button Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="w-full max-w-md mx-auto px-4 mb-12"
        >
          <div className="space-y-4">
            <Button 
              onClick={() => navigate('/auth/register')} 
              className="w-full py-6 bg-[#46C8B6] hover:bg-[#38a596] text-white font-semibold text-base rounded-full shadow-md hover:shadow-lg transition-all"
            >
              Create Account
            </Button>
            
            <Button 
              onClick={() => navigate('/auth/login')} 
              variant="outline"
              className="w-full py-6 border-[#46C8B6] text-[#46C8B6] bg-transparent hover:bg-[#46C8B6]/10 font-semibold text-base rounded-full"
            >
              I already have an account
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="p-6 text-center text-gray-500 text-sm mt-auto border-t border-gray-100">
        <p>© {new Date().getFullYear()} PoudelX Chat. All rights reserved.</p>
        <p className="mt-1 text-xs">Designed & Developed by Santosh Poudel</p>
      </div>
    </div>
  );
};

export default Landing;
