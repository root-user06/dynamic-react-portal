
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { motion } from 'framer-motion';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-white text-black overflow-hidden">
      {/* Logo Section */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* App Logo */}
        <div className="mb-12 text-center">
          <div className="flex justify-center items-center">
            <svg width="80" height="80" viewBox="0 0 589 558" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="100%" height="100%" fill="none" />
              <path d="M139.903 558H0.0643966C-3.16265 558 115.7 186 175.535 0H317.39L285.12 102.982C341.593 108.825 450.506 88.3743 467.986 184.052C486.81 249.055 408.151 325.743 381.259 325.743H589C588.328 345.463 571.789 386.51 511.013 392.937C450.237 399.364 327.027 395.615 273.019 392.937C234.629 391.034 232.764 341.504 235.731 340.969C230.151 338.474 276.519 325.604 285.12 316.979C314.701 299.45 330.836 263.662 328.82 230.065C328.82 188.435 278.397 167.254 264.951 172.366L139.903 558Z" fill="#46C8B6"/>
            </svg>
          </div>
          <h1 className="text-4xl font-bold mt-4">Chat App</h1>
          <p className="text-gray-600 mt-2">Connect with your friends and family</p>
        </div>

        {/* Auth Button Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md mx-auto px-8"
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
      <div className="p-4 text-center text-gray-500 text-sm">
        <p>© {new Date().getFullYear()} Chat App. All rights reserved.</p>
      </div>
    </div>
  );
};

export default Landing;
