
export interface User {
  id: string;
  name: string;
  isOnline: boolean;
  lastSeen: string;
  email?: string;
  photoURL?: string;
  peerId?: string; // Optional peer ID for calls
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  isDelivered?: boolean;
  callType?: 'audio' | 'video';
  callStatus?: 'started' | 'ended' | 'missed' | 'outgoing' | 'incoming';
}

export interface Note {
  id: string;
  creatorId: string;
  content: string;
  createdAt: string;
}

export interface ChatState {
  currentUser: User | null;
  selectedUser: User | null;
  messages: Message[];
  onlineUsers: User[];
  notes: Note[];
  lastActiveChatId: string | null;
  setCurrentUser: (user: User) => void;
  setSelectedUser: (user: User | null) => void;
  addMessage: (message: Message) => void;
  updateOnlineUsers: (users: User[]) => void;
  setMessageDelivered: (messageId: string) => void;
  setMessageRead: (messageId: string) => void;
  addNote: (note: Note) => void;
  deleteNote: (noteId: string) => void;
}

export interface AudioCall {
  highpassFilter: boolean;
}

export interface CallOptions {
  audio: boolean;
  video: boolean;
  highpassFilter?: boolean;
  noiseSuppression?: boolean;
  echoCancellation?: boolean;
}
