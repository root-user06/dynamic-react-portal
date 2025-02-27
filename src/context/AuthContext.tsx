
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from "sonner";

// Define the user type
export type User = {
  id: string;
  name: string;
  avatar?: string;
};

// Define the context type
type AuthContextType = {
  user: User | null;
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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check if user is already logged in
  useEffect(() => {
    const loadUserFromStorage = () => {
      try {
        // First check session storage
        const sessionUser = sessionStorage.getItem('chatUser');
        if (sessionUser) {
          setUser(JSON.parse(sessionUser));
          return;
        }
        
        // Then check cookies
        const cookieUser = getCookie('chatUser');
        if (cookieUser) {
          const parsedUser = JSON.parse(cookieUser);
          setUser(parsedUser);
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
        const userData: User = {
          id: foundUser.id,
          name: foundUser.name,
          avatar: foundUser.avatar
        };
        
        // Save to state
        setUser(userData);
        
        // Save to storage mechanisms
        const userJson = JSON.stringify(userData);
        sessionStorage.setItem('chatUser', userJson);
        setCookie('chatUser', userJson);
        
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
      const newUser: User = {
        id: `${MOCK_USERS.length + 1}`,
        name,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
      };
      
      // In a real app, we would save the user to the database here
      
      // Save to state
      setUser(newUser);
      
      // Save to storage mechanisms  
      const userJson = JSON.stringify(newUser);
      sessionStorage.setItem('chatUser', userJson);
      setCookie('chatUser', userJson);
      
      toast.success("Registration successful");
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
