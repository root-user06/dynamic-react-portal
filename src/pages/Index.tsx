
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { InputWithIcon } from "@/components/ui/input-with-icon";
import { motion } from 'framer-motion';
import { toast } from "@/components/ui/use-toast";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Mail, Lock, User as UserIcon, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const Index = () => {
  const navigate = useNavigate();
  const { login, register, isLoading } = useAuth();
  
  // Email Auth States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isRegistering) {
        await register(name, email, password);
      } else {
        await login(email, password);
      }
      // Auth context will handle the redirection
    } catch (error: any) {
      console.error('Auth error:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09122C] p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 rounded-2xl bg-[#121C3E] shadow-lg border border-white/10 text-white"
      >
        <h1 className="text-3xl font-semibold text-center mb-2 text-white">Welcome to Chat</h1>
        <p className="text-gray-300 text-center mb-8">Sign in to start chatting with your friends</p>
        
        <Tabs defaultValue="login" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-[#1A2548]">
            <TabsTrigger 
              value="login" 
              onClick={() => setIsRegistering(false)}
              className="data-[state=active]:bg-[#46C8B6] data-[state=active]:text-black"
            >
              Login
            </TabsTrigger>
            <TabsTrigger 
              value="register" 
              onClick={() => setIsRegistering(true)}
              className="data-[state=active]:bg-[#46C8B6] data-[state=active]:text-black"
            >
              Register
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div className="space-y-2">
                <InputWithIcon
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#1A2548] border-[#2A3559] text-white"
                  icon={<Mail className="w-4 h-4" />}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <InputWithIcon
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#1A2548] border-[#2A3559] text-white"
                  icon={<Lock className="w-4 h-4" />}
                  required
                  disabled={isLoading}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-[#46C8B6] hover:bg-[#38A596] text-black"
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
            </form>
          </TabsContent>
          
          <TabsContent value="register">
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div className="space-y-2">
                <InputWithIcon
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#1A2548] border-[#2A3559] text-white"
                  icon={<UserIcon className="w-4 h-4" />}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <InputWithIcon
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#1A2548] border-[#2A3559] text-white"
                  icon={<Mail className="w-4 h-4" />}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <InputWithIcon
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#1A2548] border-[#2A3559] text-white"
                  icon={<Lock className="w-4 h-4" />}
                  required
                  disabled={isLoading}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-[#46C8B6] hover:bg-[#38A596] text-black"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating Account...
                  </div>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default Index;
