
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from "sonner";
import { User } from '@/lib/types';
import { 
  registerWithEmail, 
  loginWithEmail, 
  loginWithGoogle,
  updateUserStatus
} from '../lib/firebase';

// Define the user type
export type AuthUser = {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
};

// Define the context type
type AuthContextType = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
};

// Create the initial context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
    const loadUserFromStorage = async () => {
      try {
        // Try to get user from session storage first
        const storedUser = sessionStorage.getItem('chatUser');
        
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          
          // Update user status in Firebase
          await updateUserStatus({
            id: userData.id,
            name: userData.name,
            isOnline: true,
            lastSeen: new Date().toISOString(),
            email: userData.email,
            photoURL: userData.photoURL
          });
          
          setIsLoading(false);
          return;
        }
        
        // If not in session storage, try cookies
        const cookieUser = getUserFromCookie();
        
        if (cookieUser) {
          setUser(cookieUser);
          
          // Update user status in Firebase
          await updateUserStatus({
            id: cookieUser.id,
            name: cookieUser.name,
            isOnline: true,
            lastSeen: new Date().toISOString(),
            email: cookieUser.email,
            photoURL: cookieUser.photoURL
          });
          
          // Also save to session storage for faster access
          sessionStorage.setItem('chatUser', JSON.stringify(cookieUser));
        }
      } catch (error) {
        console.error("Error loading user from storage:", error);
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
      // Use Firebase authentication
      const userData = await loginWithEmail(email, password);
      
      const authUser: AuthUser = {
        id: userData.id,
        name: userData.name,
        email: userData.email || '',
        photoURL: userData.photoURL
      };
      
      setUser(authUser);
      
      // Save user to both session storage and cookies
      sessionStorage.setItem('chatUser', JSON.stringify(authUser));
      saveUserToCookie(authUser);
      
      toast.success("Login successful");
    } catch (error: any) {
      toast.error(error.message || "Invalid email or password");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    
    try {
      // Use Firebase authentication
      const userData = await registerWithEmail(email, password, name);
      
      const authUser: AuthUser = {
        id: userData.id,
        name: userData.name,
        email: userData.email || '',
        photoURL: userData.photoURL
      };
      
      setUser(authUser);
      
      // Save user to both session storage and cookies
      sessionStorage.setItem('chatUser', JSON.stringify(authUser));
      saveUserToCookie(authUser);
      
      toast.success("Registration successful");
    } catch (error: any) {
      toast.error(error.message || "Registration failed");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Google login function
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    
    try {
      // Use Firebase Google authentication
      const userData = await loginWithGoogle();
      
      const authUser: AuthUser = {
        id: userData.id,
        name: userData.name,
        email: userData.email || '',
        photoURL: userData.photoURL
      };
      
      setUser(authUser);
      
      // Save user to both session storage and cookies
      sessionStorage.setItem('chatUser', JSON.stringify(authUser));
      saveUserToCookie(authUser);
      
      toast.success("Google login successful");
    } catch (error: any) {
      toast.error(error.message || "Google login failed");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    if (user) {
      // Update user status to offline in Firebase
      updateUserStatus({
        id: user.id,
        name: user.name,
        isOnline: false,
        lastSeen: new Date().toISOString(),
        email: user.email,
        photoURL: user.photoURL
      });
    }
    
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
        loginWithGoogle: handleGoogleLogin,
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
