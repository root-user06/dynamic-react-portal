import { create } from 'zustand';
import { ChatState, Message, User } from './types';
import { persist } from 'zustand/middleware';
import { sendMessage, updateUserStatus, subscribeToMessages, subscribeToUsers, updateMessageReadStatus } from './firebase';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const loadUserFromStorage = (): User | null => {
  try {
    const sessionUser = sessionStorage.getItem('currentUser');
    if (sessionUser) {
      return JSON.parse(sessionUser);
    }
    return null;
  } catch (error) {
    console.error('Error loading user from storage:', error);
    return null;
  }
};

const saveUserToStorage = (user: User | null) => {
  try {
    if (user) {
      sessionStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      sessionStorage.removeItem('currentUser');
    }
  } catch (error) {
    console.error('Error saving user to storage:', error);
  }
};

const loadLastActiveChatId = (): string | null => {
  try {
    return sessionStorage.getItem('lastActiveChatId');
  } catch (error) {
    console.error('Error loading last active chat ID:', error);
    return null;
  }
};

const saveLastActiveChatId = (id: string | null) => {
  try {
    if (id) {
      sessionStorage.setItem('lastActiveChatId', id);
    } else {
      sessionStorage.removeItem('lastActiveChatId');
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
      setCurrentUser: async (user: User | null) => {
        try {
          if (user) {
            saveUserToStorage(user);
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
        set((state) => {
          if (user && user.id !== state.currentUser?.id) {
            saveLastActiveChatId(user.id);
            
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
          
          saveLastActiveChatId(null);
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
    }),
    {
      name: 'chat-store',
      partialize: (state) => ({
        currentUser: state.currentUser,
        lastActiveChatId: state.lastActiveChatId,
      }),
      storage: {
        getItem: (name) => {
          const str = sessionStorage.getItem(name);
          return str ? JSON.parse(str) : null;
        },
        setItem: (name, value) => {
          sessionStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => sessionStorage.removeItem(name),
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
}

// Cleanup subscriptions on window unload
if (typeof window !== 'undefined') {
  window.addEventListener('unload', cleanupSubscriptions);
}
