
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from "sonner";
import { useChatStore } from '@/lib/store';
import { User as UserType } from '@/lib/types';

// Define the context type
type AuthContextType = {
  user: UserType | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cookie helper functions
const setCookie = (name: string, value: string, days: number = 7) => {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = `; expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value}${expires}; path=/; SameSite=Strict`;
};

const getCookie = (name: string): string | null => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

const removeCookie = (name: string) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict`;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { setCurrentUser } = useChatStore();

  // Check if user is already logged in from cookies or session storage
  useEffect(() => {
    const loadUserFromStorage = () => {
      try {
        // First check session storage
        const sessionUser = sessionStorage.getItem('chatUser');
        if (sessionUser) {
          const userData = JSON.parse(sessionUser);
          setUser(userData);
          setCurrentUser(userData);
          return;
        }
        
        // Then check cookies
        const cookieUser = getCookie('chatUser');
        if (cookieUser) {
          const userData = JSON.parse(cookieUser);
          setUser(userData);
          setCurrentUser(userData);
          // Update session storage too
          sessionStorage.setItem('chatUser', cookieUser);
        }
      } catch (error) {
        console.error('Error loading user from storage:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserFromStorage();
  }, [setCurrentUser]);

  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      // Here we're using the mockData from useChatStore
      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock login - in a real app, this would validate with a server
      const mockUser: UserType = {
        id: "1",
        name: "John Doe",
        isOnline: true,
        lastSeen: new Date().toISOString(),
        avatar: "https://github.com/shadcn.png"
      };
      
      // Save to state
      setUser(mockUser);
      
      // Save to chat store
      setCurrentUser(mockUser);
      
      // Save to storage mechanisms
      const userJson = JSON.stringify(mockUser);
      sessionStorage.setItem('chatUser', userJson);
      setCookie('chatUser', userJson);
      
      toast.success("Login successful");
    } catch (error) {
      toast.error("Invalid email or password");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Create a new user (in a real app, this would be an API call)
      const newUser: UserType = {
        id: Date.now().toString(),
        name,
        isOnline: true,
        lastSeen: new Date().toISOString(),
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
      };
      
      // Save to state
      setUser(newUser);
      
      // Save to chat store
      setCurrentUser(newUser);
      
      // Save to storage mechanisms  
      const userJson = JSON.stringify(newUser);
      sessionStorage.setItem('chatUser', userJson);
      setCookie('chatUser', userJson);
      
      toast.success("Registration successful");
    } catch (error) {
      toast.error("Registration failed");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    // Clear state
    setUser(null);
    
    // Clear storage mechanisms
    sessionStorage.removeItem('chatUser');
    removeCookie('chatUser');
    
    // Clear from chat store
    setCurrentUser(null);
    
    toast.success("Logged out successfully");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
