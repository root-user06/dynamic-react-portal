export interface User {
  id: string;
  name: string;
  email?: string;
  photoURL?: string;
  isOnline: boolean;
  lastSeen: string;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  timestamp: string;
  isRead: boolean;
}

export interface ChatState {
  currentUser: User | null;
  selectedUser: User | null;
  messages: Message[];
  onlineUsers: User[];
  lastActiveChatId: string | null;
  setCurrentUser: (user: User | null) => Promise<void>;
  setSelectedUser: (user: User | null) => void;
  addMessage: (message: Message) => Promise<void>;
  updateOnlineUsers: (users: User[]) => void;
}
