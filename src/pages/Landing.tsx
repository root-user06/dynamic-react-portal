
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
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white text-black overflow-y-auto">
      {/* Logo Section */}
      <div className="flex-1 flex flex-col items-center justify-start pt-12 md:pt-24 px-4">
        {/* App Logo */}
        <div className="mb-6 text-center">
          <div className="flex justify-center items-center">
            <svg width="80" height="80" viewBox="0 0 589 558" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="100%" height="100%" fill="none" />
              <path d="M139.903 558H0.0643966C-3.16265 558 115.7 186 175.535 0H317.39L285.12 102.982C341.593 108.825 450.506 88.3743 467.986 184.052C486.81 249.055 408.151 325.743 381.259 325.743H589C588.328 345.463 571.789 386.51 511.013 392.937C450.237 399.364 327.027 395.615 273.019 392.937C234.629 391.034 232.764 341.504 235.731 340.969C230.151 338.474 276.519 325.604 285.12 316.979C314.701 299.45 330.836 263.662 328.82 230.065C328.82 188.435 278.397 167.254 264.951 172.366L139.903 558Z" fill="#46C8B6"/>
            </svg>
          </div>
          <h1 className="text-4xl font-bold mt-2">PoudelX Chat</h1>
          <p className="text-gray-600 mt-1">Developed by Santosh Poudel</p>
        </div>

        {/* Dummy Chat Boxes */}
        <div className="w-full max-w-md mx-auto mb-8 px-4 relative h-80">
          <AnimatePresence>
            {visibleChats.map((chatId, index) => (
              <motion.div
                key={`${chatId}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ duration: 0.5 }}
                className={`absolute w-full left-0 rounded-lg shadow-md p-4 ${
                  index === 0 ? 'bg-[#F1F0FB]' : 'bg-white border border-gray-100'
                }`}
                style={{
                  top: `${index * 20}px`,
                  zIndex: visibleChats.length - index,
                }}
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-[#46C8B6]/10 flex items-center justify-center text-[#46C8B6] flex-shrink-0">
                    {dummyChats[chatId].name[0]}
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="font-medium text-sm">{dummyChats[chatId].name}</p>
                    <p className="text-xs text-gray-600 truncate">{dummyChats[chatId].message}</p>
                  </div>
                  <div className="text-[10px] text-gray-400 flex-shrink-0">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Website Developer Info */}
        <div className="text-center mb-8">
          <p className="text-sm text-gray-600">
            PoudelX Chat is a modern messaging application designed for seamless communication.
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Connect with friends and colleagues instantly!
          </p>
        </div>

        {/* Auth Button Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="w-full max-w-md mx-auto px-4 mb-12"
        >
          <div className="space-y-4">
            <Button 
              onClick={() => navigate('/auth/register')} 
              className="w-full py-6 bg-[#46C8B6] hover:bg-[#38a596] text-black font-semibold text-base rounded-full"
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
      <div className="p-4 text-center text-gray-500 text-sm mt-auto">
        <p>© {new Date().getFullYear()} PoudelX Chat. All rights reserved.</p>
        <p className="mt-1 text-xs">Designed & Developed by Santosh Poudel</p>
      </div>
    </div>
  );
};

export default Landing;
