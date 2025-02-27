
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { toast } from "sonner";

// Define the message type
export type Message = {
  id: string;
  text: string;
  senderId: string;
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read';
};

// Define the conversation type
export type Conversation = {
  id: string;
  participants: string[];
  messages: Message[];
  lastMessage?: Message;
};

// Define the context type
type ChatContextType = {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  setCurrentConversation: (conversation: Conversation) => void;
  sendMessage: (text: string) => Promise<void>;
  isLoading: boolean;
};

// Create the context
const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Mock conversation data
const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: '1',
    participants: ['1', '2'],
    messages: [
      {
        id: '1',
        text: 'Hey there! How are you?',
        senderId: '2',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        status: 'read'
      },
      {
        id: '2',
        text: 'I\'m good, thanks for asking! How about you?',
        senderId: '1',
        timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000),
        status: 'read'
      },
      {
        id: '3',
        text: 'I\'m doing well. Just working on a new project.',
        senderId: '2',
        timestamp: new Date(Date.now() - 22 * 60 * 60 * 1000),
        status: 'read'
      },
      {
        id: '4',
        text: 'That sounds exciting! What kind of project is it?',
        senderId: '1',
        timestamp: new Date(Date.now() - 21 * 60 * 60 * 1000),
        status: 'read'
      },
      {
        id: '5',
        text: 'It\'s a new chat application with a clean, minimalist design.',
        senderId: '2',
        timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000),
        status: 'read'
      }
    ]
  }
];

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load conversations when user changes
  useEffect(() => {
    if (user) {
      setIsLoading(true);
      
      // Simulate API call delay
      setTimeout(() => {
        // Filter conversations where the user is a participant
        const userConversations = MOCK_CONVERSATIONS.filter(
          conv => conv.participants.includes(user.id)
        );
        
        setConversations(userConversations);
        
        // Set the first conversation as current if there's no current conversation
        if (userConversations.length > 0 && !currentConversation) {
          setCurrentConversation(userConversations[0]);
        }
        
        setIsLoading(false);
      }, 1000);
    } else {
      setConversations([]);
      setCurrentConversation(null);
    }
  }, [user]);

  // Send a message
  const sendMessage = async (text: string) => {
    if (!user || !currentConversation) return;
    
    // Create a new message
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      senderId: user.id,
      timestamp: new Date(),
      status: 'sending'
    };
    
    // Add the message to the current conversation optimistically
    const updatedConversation = {
      ...currentConversation,
      messages: [...currentConversation.messages, newMessage],
      lastMessage: newMessage
    };
    
    setCurrentConversation(updatedConversation);
    
    // Update the conversations list
    const updatedConversations = conversations.map(conv => 
      conv.id === currentConversation.id ? updatedConversation : conv
    );
    
    setConversations(updatedConversations);
    
    // Simulate sending the message
    setTimeout(() => {
      // Update the message status to sent
      const sentMessage = { ...newMessage, status: 'sent' as const };
      
      const finalConversation = {
        ...updatedConversation,
        messages: updatedConversation.messages.map(msg => 
          msg.id === newMessage.id ? sentMessage : msg
        ),
        lastMessage: sentMessage
      };
      
      setCurrentConversation(finalConversation);
      
      const finalConversations = updatedConversations.map(conv => 
        conv.id === currentConversation.id ? finalConversation : conv
      );
      
      setConversations(finalConversations);
      
      // Simulate a reply after 2 seconds
      if (Math.random() > 0.3) {
        setTimeout(() => {
          const replyMessage: Message = {
            id: Date.now().toString(),
            text: getRandomReply(),
            senderId: '2', // Jane's ID
            timestamp: new Date(),
            status: 'sent'
          };
          
          const replyConversation = {
            ...finalConversation,
            messages: [...finalConversation.messages, replyMessage],
            lastMessage: replyMessage
          };
          
          setCurrentConversation(replyConversation);
          
          const replyConversations = finalConversations.map(conv => 
            conv.id === currentConversation.id ? replyConversation : conv
          );
          
          setConversations(replyConversations);
        }, 2000);
      }
    }, 1000);
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        currentConversation,
        setCurrentConversation,
        sendMessage,
        isLoading
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

// Custom hook to use the chat context
export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

// Helper function to get a random reply
function getRandomReply(): string {
  const replies = [
    "That's interesting!",
    "I see what you mean.",
    "Tell me more about that.",
    "I hadn't thought of it that way.",
    "Thanks for sharing that with me.",
    "That makes a lot of sense.",
    "I appreciate your perspective.",
    "That's a good point.",
    "I'll need to think about that.",
    "I'm not sure I follow. Could you explain?",
    "I've been thinking the same thing!",
    "That reminds me of something...",
    "How long have you felt that way?",
    "Let's discuss this more later.",
    "I'm glad you brought that up."
  ];
  
  return replies[Math.floor(Math.random() * replies.length)];
}
