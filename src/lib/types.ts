
export interface User {
  id: string;
  name: string;
  email?: string;
  photoURL?: string;
  isOnline?: boolean;
  lastSeen?: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface ChatState {
  currentUser: User | null;
  selectedUser: User | null;
  messages: Message[];
  onlineUsers: User[];
  lastActiveChatId: string | null;
  rememberMe: boolean;
  setRememberMe: (value: boolean) => void;
  setCurrentUser: (user: User | null) => void;
  setSelectedUser: (user: User | null) => void;
  addMessage: (message: Message) => Promise<void>;
  updateOnlineUsers: (users: User[]) => void;
  checkSession: () => boolean;
  logout: () => void;
}
