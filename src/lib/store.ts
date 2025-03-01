import { create } from 'zustand';
import { ChatState, Message, User } from './types';
import { persist } from 'zustand/middleware';
import { sendMessage, updateUserStatus, subscribeToMessages, subscribeToUsers, updateMessageReadStatus } from './firebase';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const loadUserFromStorage = (): User | null => {
  try {
    // Try to get user from both localStorage and sessionStorage
    const localUser = localStorage.getItem('currentUser');
    const sessionUser = sessionStorage.getItem('currentUser');
    
    if (localUser) {
      return JSON.parse(localUser);
    }
    
    if (sessionUser) {
      return JSON.parse(sessionUser);
    }
    
    return null;
  } catch (error) {
    console.error('Error loading user from storage:', error);
    return null;
  }
};

const saveUserToStorage = (user: User | null, rememberMe: boolean = false) => {
  try {
    if (user) {
      // Save to both storages for better persistence
      sessionStorage.setItem('currentUser', JSON.stringify(user));
      
      if (rememberMe) {
        localStorage.setItem('currentUser', JSON.stringify(user));
      } else {
        localStorage.removeItem('currentUser');
      }
    } else {
      sessionStorage.removeItem('currentUser');
      localStorage.removeItem('currentUser');
    }
  } catch (error) {
    console.error('Error saving user to storage:', error);
  }
};

const loadLastActiveChatId = (): string | null => {
  try {
    const sessionChatId = sessionStorage.getItem('lastActiveChatId');
    const localChatId = localStorage.getItem('lastActiveChatId');
    
    return sessionChatId || localChatId || null;
  } catch (error) {
    console.error('Error loading last active chat ID:', error);
    return null;
  }
};

const saveLastActiveChatId = (id: string | null, rememberMe: boolean = false) => {
  try {
    if (id) {
      sessionStorage.setItem('lastActiveChatId', id);
      
      if (rememberMe) {
        localStorage.setItem('lastActiveChatId', id);
      } else {
        localStorage.removeItem('lastActiveChatId');
      }
    } else {
      sessionStorage.removeItem('lastActiveChatId');
      localStorage.removeItem('lastActiveChatId');
    }
  } catch (error) {
    console.error('Error saving last active chat ID:', error);
  }
};

// Initialize auth state listener
const auth = getAuth();
let authUnsubscribe: (() => void) | null = null;
let messagesUnsubscribe: (() => void) | null = null;
let usersUnsubscribe: (() => void) | null = null;

// Cleanup function for all subscriptions
const cleanupSubscriptions = () => {
  if (authUnsubscribe) authUnsubscribe();
  if (messagesUnsubscribe) messagesUnsubscribe();
  if (usersUnsubscribe) usersUnsubscribe();
};

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      currentUser: loadUserFromStorage(),
      selectedUser: null,
      messages: [],
      onlineUsers: [],
      lastActiveChatId: loadLastActiveChatId(),
      rememberMe: false,
      setRememberMe: (value: boolean) => set({ rememberMe: value }),
      setCurrentUser: async (user: User | null) => {
        try {
          const rememberMe = get().rememberMe;
          
          if (user) {
            saveUserToStorage(user, rememberMe);
            const cleanup = await updateUserStatus(user);
            set({ currentUser: user });

            // Setup real-time subscriptions when user logs in
            if (typeof window !== 'undefined') {
              // Cleanup any existing subscriptions
              if (messagesUnsubscribe) messagesUnsubscribe();
              if (usersUnsubscribe) usersUnsubscribe();

              // Setup new subscriptions
              messagesUnsubscribe = subscribeToMessages((messages) => {
                set({ messages });
              });

              usersUnsubscribe = subscribeToUsers((users) => {
                set({ onlineUsers: users });
              });

              // Handle cleanup when window closes
              const handleUnload = () => {
                cleanup();
                cleanupSubscriptions();
              };
              window.addEventListener('beforeunload', handleUnload);
            }
          } else {
            // Cleanup on logout
            cleanupSubscriptions();
            saveUserToStorage(null);
            set({ 
              currentUser: null, 
              selectedUser: null, 
              messages: [], 
              onlineUsers: [],
              lastActiveChatId: null 
            });
          }
        } catch (error) {
          console.error('Error updating user status:', error);
          set({ currentUser: user });
        }
      },
      setSelectedUser: (user: User | null) => {
        const rememberMe = get().rememberMe;
        
        set((state) => {
          if (user && user.id !== state.currentUser?.id) {
            saveLastActiveChatId(user.id, rememberMe);
            
            // Mark messages as read immediately
            const updatedMessages = state.messages.map(msg => {
              if (msg.senderId === user.id && 
                  msg.receiverId === state.currentUser?.id && 
                  !msg.isRead) {
                updateMessageReadStatus(msg.id, true).catch(console.error);
                return { ...msg, isRead: true };
              }
              return msg;
            });
            
            return { 
              selectedUser: user, 
              messages: updatedMessages,
              lastActiveChatId: user.id
            };
          }
          
          saveLastActiveChatId(null, rememberMe);
          return { 
            selectedUser: user,
            lastActiveChatId: null
          };
        });
      },
      addMessage: async (message: Message) => {
        set((state) => {
          // Check for duplicate messages
          const messageExists = state.messages.some(msg => 
            msg.id === message.id || 
            (msg.senderId === message.senderId && 
             msg.receiverId === message.receiverId && 
             msg.content === message.content && 
             Math.abs(new Date(msg.timestamp).getTime() - new Date(message.timestamp).getTime()) < 1000)
          );
          
          if (!messageExists) {
            return { messages: [...state.messages, message] };
          }
          return state;
        });
        
        try {
          await sendMessage(message);
        } catch (error) {
          console.error('Error sending message:', error);
          // Remove the message from state if sending failed
          set((state) => ({
            messages: state.messages.filter(m => m.id !== message.id)
          }));
          throw error;
        }
      },
      updateOnlineUsers: (users: User[]) => set({ onlineUsers: users }),
      checkSession: () => {
        const user = loadUserFromStorage();
        if (user) {
          get().setCurrentUser(user);
          return true;
        }
        return false;
      },
      logout: () => {
        cleanupSubscriptions();
        saveUserToStorage(null);
        localStorage.removeItem('currentUser');
        sessionStorage.removeItem('currentUser');
        localStorage.removeItem('lastActiveChatId');
        sessionStorage.removeItem('lastActiveChatId');
        
        set({ 
          currentUser: null, 
          selectedUser: null, 
          messages: [], 
          onlineUsers: [],
          lastActiveChatId: null,
          rememberMe: false
        });
      }
    }),
    {
      name: 'chat-store',
      partialize: (state) => ({
        currentUser: state.currentUser,
        lastActiveChatId: state.lastActiveChatId,
        rememberMe: state.rememberMe
      }),
      storage: {
        getItem: (name) => {
          // Try to get from sessionStorage first, then localStorage
          try {
            const sessionValue = sessionStorage.getItem(name);
            if (sessionValue) return JSON.parse(sessionValue);
            
            const localValue = localStorage.getItem(name);
            return localValue ? JSON.parse(localValue) : null;
          } catch (error) {
            console.error('Error getting item from storage:', error);
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            // Fix the type error by converting value to string before storing
            const stringValue = JSON.stringify(value);
            
            // Parse the value to extract rememberMe flag
            const parsedObj = JSON.parse(stringValue);
            const { rememberMe } = parsedObj;
            
            // Always save to sessionStorage
            sessionStorage.setItem(name, stringValue);
            
            // Save to localStorage only if rememberMe is true
            if (rememberMe) {
              localStorage.setItem(name, stringValue);
            } else {
              localStorage.removeItem(name);
            }
          } catch (error) {
            console.error('Error setting item in storage:', error);
          }
        },
        removeItem: (name) => {
          try {
            sessionStorage.removeItem(name);
            localStorage.removeItem(name);
          } catch (error) {
            console.error('Error removing item from storage:', error);
          }
        },
      },
    }
  )
);

// Initialize auth state listener
if (typeof window !== 'undefined') {
  authUnsubscribe = onAuthStateChanged(auth, (user) => {
    if (!user && useChatStore.getState().currentUser) {
      useChatStore.getState().setCurrentUser(null);
    }
  });
  
  // Check session on load
  const hasSession = useChatStore.getState().checkSession();
  console.log("User session found:", hasSession);
}

// Cleanup subscriptions on window unload
if (typeof window !== 'undefined') {
  window.addEventListener('unload', cleanupSubscriptions);
}
