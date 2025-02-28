import { initializeApp, getApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, push, Database, update, onDisconnect } from 'firebase/database';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  updateProfile,
  sendPasswordResetEmail,
  AuthError,
  signOut
} from 'firebase/auth';
import { Message, User } from './types';

// Declare custom window property
declare global {
  interface Window {
    activityTimeout?: NodeJS.Timeout;
  }
}

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCcWUwbXc6r1M14CNfeojVDo7SyFylvrY8",
  authDomain: "website-database-b5b62.firebaseapp.com",
  databaseURL: "https://website-database-b5b62-default-rtdb.firebaseio.com",
  projectId: "website-database-b5b62",
  storageBucket: "website-database-b5b62.appspot.com",
  messagingSenderId: "799535806005",
  appId: "1:799535806005:web:63752dcd35f62feb55a37c",
  measurementId: "G-4F1W5ZS53S"
};

// Initialize Firebase with error handling
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log('Firebase initialized successfully');
} catch (error: any) {
  if (error.code !== 'app/duplicate-app') {
    console.error('Firebase initialization error:', error);
    throw error;
  }
  app = getApp(); // Get the already initialized app
}

// Initialize Firebase services
const database = getDatabase(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Helper function to format auth errors
const formatAuthError = (error: AuthError): string => {
  switch (error.code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address';
    case 'auth/user-disabled':
      return 'This account has been disabled';
    case 'auth/user-not-found':
      return 'No account found with this email';
    case 'auth/wrong-password':
      return 'Incorrect password';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters';
    case 'auth/popup-closed-by-user':
      return 'Sign in was cancelled. Please try again';
    case 'auth/cancelled-popup-request':
      return 'Only one sign in window allowed at a time';
    case 'auth/popup-blocked':
      return 'Sign in popup was blocked by your browser';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection';
    case 'auth/missing-email':
      return 'Please enter your email address';
    case 'auth/invalid-action-code':
      return 'The password reset link is invalid or has expired';
    default:
      return 'An error occurred during authentication. Please try again';
  }
};

// Auth Operations
export const registerWithEmail = async (email: string, password: string, name: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    const user: User = {
      id: userCredential.user.uid,
      name: name,
      email: email,
      isOnline: true,
      lastSeen: new Date().toISOString()
    };
    await updateUserStatus(user);
    return user;
  } catch (error: any) {
    throw new Error(formatAuthError(error));
  }
};

export const loginWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user: User = {
      id: userCredential.user.uid,
      name: userCredential.user.displayName || 'User',
      email: email,
      isOnline: true,
      lastSeen: new Date().toISOString()
    };
    await updateUserStatus(user);
    return user;
  } catch (error: any) {
    throw new Error(formatAuthError(error));
  }
};

export const loginWithGoogle = async () => {
  try {
    // Configure Google provider
    googleProvider.setCustomParameters({
      prompt: 'select_account'
    });
    
    const result = await signInWithPopup(auth, googleProvider);
    const user: User = {
      id: result.user.uid,
      name: result.user.displayName || 'User',
      email: result.user.email || undefined,
      photoURL: result.user.photoURL || undefined,
      isOnline: true,
      lastSeen: new Date().toISOString()
    };
    await updateUserStatus(user);
    return user;
  } catch (error: any) {
    throw new Error(formatAuthError(error));
  }
};

// Initialize RecaptchaVerifier
export const initRecaptcha = (buttonId: string) => {
  return new RecaptchaVerifier(auth, buttonId, {
    size: 'invisible'
  });
};

export const loginWithPhone = async (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier) => {
  return signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
};

// Database References
const getMessagesRef = () => {
  return ref(database, 'messages');
};

const getUsersRef = () => {
  return ref(database, 'users');
};

// Message Operations
export const sendMessage = async (message: Message) => {
  const newMessageRef = push(ref(database, 'messages'));
  await set(newMessageRef, { ...message, id: newMessageRef.key });
};

export const updateMessageReadStatus = async (messageId: string, isRead: boolean) => {
  const messageRef = ref(database, `messages/${messageId}`);
  await update(messageRef, { isRead });
};

export const subscribeToMessages = (callback: (messages: Message[]) => void): () => void => {
  const messagesRef = ref(database, 'messages');
  const unsubscribe = onValue(messagesRef, (snapshot) => {
    const data = snapshot.val();
    const messages: Message[] = data ? Object.values(data) : [];
    callback(messages);
  });
  return () => unsubscribe();
};

// User Operations
export const updateUserStatus = async (user: User) => {
  if (!user || !user.id) return;

  const userStatusRef = ref(database, `users/${user.id}`);
  const userStatusDatabaseRef = ref(database, '.info/connected');

  onValue(userStatusDatabaseRef, (snapshot) => {
    if (snapshot.val() === false) {
      return;
    }

    onDisconnect(userStatusRef)
      .update({
        isOnline: false,
        lastSeen: new Date().toISOString()
      })
      .then(() => {
        set(userStatusRef, {
          ...user,
          isOnline: true,
          lastSeen: new Date().toISOString()
        });
      });
  });

  // Clear any existing activity timeout
  if (window.activityTimeout) {
    clearTimeout(window.activityTimeout);
  }

  // Set up activity monitoring
  const activityEvents = ['mousedown', 'keydown', 'touchstart', 'mousemove'];
  let timeoutId: NodeJS.Timeout;

  const resetActivityTimeout = () => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      set(userStatusRef, {
        ...user,
        isOnline: false,
        lastSeen: new Date().toISOString()
      });
    }, 60000); // Set to offline after 1 minute of inactivity
  };

  const handleActivity = () => {
    set(userStatusRef, {
      ...user,
      isOnline: true,
      lastSeen: new Date().toISOString()
    });
    resetActivityTimeout();
  };

  activityEvents.forEach(event => {
    window.removeEventListener(event, handleActivity);
    window.addEventListener(event, handleActivity);
  });

  // Initial status
  set(userStatusRef, {
    ...user,
    isOnline: true,
    lastSeen: new Date().toISOString()
  });

  resetActivityTimeout();

  // Cleanup function
  return () => {
    activityEvents.forEach(event => {
      window.removeEventListener(event, handleActivity);
    });
    if (timeoutId) clearTimeout(timeoutId);
    set(userStatusRef, {
      ...user,
      isOnline: false,
      lastSeen: new Date().toISOString()
    });
  };
};

export const subscribeToUsers = (callback: (users: User[]) => void): () => void => {
  const usersRef = ref(database, 'users');
  const unsubscribe = onValue(usersRef, (snapshot) => {
    const data = snapshot.val();
    const users: User[] = data ? Object.values(data) : [];
    callback(users);
  });
  return () => unsubscribe();
};

export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    throw new Error(formatAuthError(error));
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    return true;
  } catch (error: any) {
    throw new Error('Failed to logout. Please try again.');
  }
};

export { database };

// Initialize some demo users
const initializeDemoUsers = async () => {
  const demoUsers = [
    {
      id: "user1",
      name: "John Doe",
      email: "john@example.com",
      isOnline: true,
      lastSeen: new Date().toISOString()
    },
    {
      id: "user2",
      name: "Jane Smith",
      email: "jane@example.com",
      isOnline: true,
      lastSeen: new Date().toISOString()
    },
    {
      id: "user3",
      name: "Bob Johnson",
      email: "bob@example.com",
      isOnline: false,
      lastSeen: new Date().toISOString()
    }
  ];

  const usersRef = ref(database, 'users');
  
  // Check if users already exist
  onValue(usersRef, (snapshot) => {
    if (!snapshot.exists() || Object.keys(snapshot.val()).length < 3) {
      // Add demo users only if there are fewer than 3 users
      demoUsers.forEach(user => {
        set(ref(database, `users/${user.id}`), user);
      });
    }
  }, { onlyOnce: true });
};

// Call the function to initialize users when the app starts
initializeDemoUsers();
