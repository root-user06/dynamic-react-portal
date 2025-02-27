
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from "sonner";
import { User } from '@/lib/types';

// Define the user type
export type AuthUser = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
};

// Define the context type
type AuthContextType = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

// Create the initial context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demo purposes
const MOCK_USERS = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=random'
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: 'password123',
    avatar: 'https://ui-avatars.com/api/?name=Jane+Smith&background=random'
  }
];

// Helper function to save user in cookies
const saveUserToCookie = (user: AuthUser) => {
  const expires = new Date();
  expires.setDate(expires.getDate() + 7); // 7 days from now
  document.cookie = `chatUser=${JSON.stringify(user)};expires=${expires.toUTCString()};path=/`;
};

// Helper function to get user from cookies
const getUserFromCookie = (): AuthUser | null => {
  const cookies = document.cookie.split(';');
  const userCookie = cookies.find(cookie => cookie.trim().startsWith('chatUser='));
  
  if (userCookie) {
    try {
      return JSON.parse(userCookie.split('=')[1]);
    } catch (e) {
      return null;
    }
  }
  
  return null;
};

// Helper function to remove user from cookies
const removeUserFromCookie = () => {
  document.cookie = 'chatUser=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check if user is already logged in
  useEffect(() => {
    // Try to get user from session storage first
    const storedUser = sessionStorage.getItem('chatUser');
    
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsLoading(false);
      return;
    }
    
    // If not in session storage, try cookies
    const cookieUser = getUserFromCookie();
    
    if (cookieUser) {
      setUser(cookieUser);
      // Also save to session storage for faster access
      sessionStorage.setItem('chatUser', JSON.stringify(cookieUser));
    }
    
    setIsLoading(false);
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const foundUser = MOCK_USERS.find(
        u => u.email === email && u.password === password
      );
      
      if (foundUser) {
        const userData: AuthUser = {
          id: foundUser.id,
          name: foundUser.name,
          email: foundUser.email,
          avatar: foundUser.avatar
        };
        
        setUser(userData);
        
        // Save user to both session storage and cookies
        sessionStorage.setItem('chatUser', JSON.stringify(userData));
        saveUserToCookie(userData);
        
        toast.success("Login successful");
      } else {
        toast.error("Invalid email or password");
        throw new Error('Invalid email or password');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if email already exists
      if (MOCK_USERS.some(u => u.email === email)) {
        toast.error("Email already in use");
        throw new Error('Email already in use');
      }
      
      // Create new user (in a real app, this would be an API call)
      const newUser: AuthUser = {
        id: `${MOCK_USERS.length + 1}`,
        name,
        email,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
      };
      
      // In a real app, we would save the user to the database here
      
      setUser(newUser);
      
      // Save user to both session storage and cookies
      sessionStorage.setItem('chatUser', JSON.stringify(newUser));
      saveUserToCookie(newUser);
      
      toast.success("Registration successful");
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('chatUser');
    removeUserFromCookie();
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
