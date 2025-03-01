
import { create } from 'zustand';
import { ChatState, Message, User } from './types';
import { persist } from 'zustand/middleware';
import { sendMessage, updateUserStatus, subscribeToMessages, subscribeToUsers, updateMessageReadStatus } from './firebase';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

// Simplified storage functions to prevent race conditions
const loadUserFromStorage = (): User | null => {
  try {
    const localUser = localStorage.getItem('currentUser');
    const sessionUser = sessionStorage.getItem('currentUser');
    
    return localUser ? JSON.parse(localUser) : 
           sessionUser ? JSON.parse(sessionUser) : null;
  } catch (error) {
    console.error('Error loading user from storage:', error);
    return null;
  }
};

const saveUserToStorage = (user: User | null, rememberMe: boolean = false) => {
  try {
    if (user) {
      // Always save to sessionStorage for the current session
      sessionStorage.setItem('currentUser', JSON.stringify(user));
      
      // Only save to localStorage if rememberMe is true
      if (rememberMe) {
        localStorage.setItem('currentUser', JSON.stringify(user));
      } else {
        localStorage.removeItem('currentUser');
      }
    } else {
      // Clear both storages on logout
      sessionStorage.removeItem('currentUser');
      localStorage.removeItem('currentUser');
    }
  } catch (error) {
    console.error('Error saving user to storage:', error);
  }
};

// Similar simplified functions for last active chat ID
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

// Subscription management with proper cleanup
let authUnsubscribe: (() => void) | null = null;
let messagesUnsubscribe: (() => void) | null = null;
let usersUnsubscribe: (() => void) | null = null;

// Cleanup function for all subscriptions
const cleanupSubscriptions = () => {
  if (authUnsubscribe) {
    authUnsubscribe();
    authUnsubscribe = null;
  }
  if (messagesUnsubscribe) {
    messagesUnsubscribe();
    messagesUnsubscribe = null;
  }
  if (usersUnsubscribe) {
    usersUnsubscribe();
    usersUnsubscribe = null;
  }
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
            // Save user first to prevent race conditions
            saveUserToStorage(user, rememberMe);
            
            // Then update Firebase status
            const cleanup = await updateUserStatus(user).catch(err => {
              console.error("Error updating user status:", err);
              return () => {}; // Return empty cleanup function on error
            });
            
            // Update state
            set({ currentUser: user });

            // Setup real-time subscriptions when user logs in
            if (typeof window !== 'undefined') {
              // Cleanup any existing subscriptions
              cleanupSubscriptions();

              // Setup new subscriptions with error handling
              try {
                messagesUnsubscribe = subscribeToMessages((messages) => {
                  set({ messages });
                });
              } catch (err) {
                console.error("Error subscribing to messages:", err);
              }

              try {
                usersUnsubscribe = subscribeToUsers((users) => {
                  set({ onlineUsers: users });
                });
              } catch (err) {
                console.error("Error subscribing to users:", err);
              }

              // Handle cleanup when window closes
              const handleUnload = () => {
                cleanup();
                cleanupSubscriptions();
              };
              
              window.removeEventListener('beforeunload', handleUnload); // Remove existing
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
          console.error('Error in setCurrentUser:', error);
          // Still update user in state even if Firebase fails
          set({ currentUser: user });
        }
      },
      
      setSelectedUser: (user: User | null) => {
        const rememberMe = get().rememberMe;
        
        set((state) => {
          if (user && user.id !== state.currentUser?.id) {
            try {
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
            } catch (error) {
              console.error('Error in setSelectedUser:', error);
              return { selectedUser: user, lastActiveChatId: user.id };
            }
          }
          
          try {
            saveLastActiveChatId(null, rememberMe);
          } catch (error) {
            console.error('Error clearing lastActiveChatId:', error);
          }
          
          return { 
            selectedUser: user,
            lastActiveChatId: null
          };
        });
      },
      
      addMessage: async (message: Message) => {
        // Add message to local state first for UI responsiveness
        set((state) => {
          // Check for duplicate messages to prevent UI issues
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
          // Then send to Firebase
          await sendMessage(message);
        } catch (error) {
          console.error('Error sending message:', error);
          // Remove message from state if sending failed
          set((state) => ({
            messages: state.messages.filter(m => m.id !== message.id)
          }));
          throw error;
        }
      },
      
      updateOnlineUsers: (users: User[]) => set({ onlineUsers: users }),
      
      checkSession: () => {
        try {
          const user = loadUserFromStorage();
          if (user) {
            get().setCurrentUser(user);
            return true;
          }
        } catch (error) {
          console.error('Error checking session:', error);
        }
        return false;
      },
      
      logout: () => {
        try {
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
        } catch (error) {
          console.error('Error during logout:', error);
          // Force state reset even if storage operations fail
          set({ 
            currentUser: null, 
            selectedUser: null, 
            messages: [], 
            onlineUsers: [],
            lastActiveChatId: null 
          });
        }
      }
    }),
    {
      name: 'chat-store',
      partialize: (state) => ({
        currentUser: state.currentUser,
        lastActiveChatId: state.lastActiveChatId,
        rememberMe: state.rememberMe
      }),
      // Simplified and more stable storage implementation
      storage: {
        getItem: (name) => {
          try {
            const sessionValue = sessionStorage.getItem(name);
            if (sessionValue) return sessionValue;
            
            const localValue = localStorage.getItem(name);
            return localValue || null;
          } catch (error) {
            console.error('Error getting item from storage:', error);
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            // Make sure value is string before storing
            const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
            
            // Parse to check for rememberMe flag
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

// Initialize auth state listener with error handling
if (typeof window !== 'undefined') {
  try {
    const auth = getAuth();
    authUnsubscribe = onAuthStateChanged(auth, 
      (user) => {
        if (!user && useChatStore.getState().currentUser) {
          useChatStore.getState().setCurrentUser(null);
        }
      },
      (error) => {
        console.error("Firebase auth observer error:", error);
      }
    );
    
    // Check session on load
    const hasSession = useChatStore.getState().checkSession();
    console.log("User session found:", hasSession);
  } catch (error) {
    console.error("Error setting up auth listener:", error);
  }
}

// Cleanup subscriptions on window unload
if (typeof window !== 'undefined') {
  window.addEventListener('unload', cleanupSubscriptions);
}
