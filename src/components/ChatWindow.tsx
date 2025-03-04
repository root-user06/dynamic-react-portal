
import { useState, useRef, useEffect } from 'react';
import { useChatStore } from '@/lib/store';
import { Message } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, MoreVertical, Phone, Video, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { useCallStore } from '@/backend/callStore';
import { useToast } from '@/components/ui/use-toast';

interface ChatWindowProps {
  showBackButton?: boolean;
  onBack?: () => void;
  onViewProfile?: () => void;
}

const ChatWindow = ({ showBackButton, onBack, onViewProfile }: ChatWindowProps) => {
  const [newMessage, setNewMessage] = useState('');
  const { messages, currentUser, selectedUser, addMessage } = useChatStore();
  const { setOutgoingCall } = useCallStore();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [selectedUser]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && currentUser && selectedUser) {
      const message: Message = {
        id: uuidv4(),
        senderId: currentUser.id,
        receiverId: selectedUser.id,
        content: newMessage.trim(),
        timestamp: new Date().toISOString(),
        isRead: false
      };
      addMessage(message);
      setNewMessage('');
    }
  };

  const handleCall = async (callType: 'audio' | 'video') => {
    if (!selectedUser || !currentUser) return;
    
    // Check if user is offline
    if (!selectedUser.isOnline) {
      toast({
        title: "Cannot make call",
        description: `${selectedUser.name} is currently offline`,
        variant: "destructive"
      });
      return;
    }
    
    try {
      const callId = await (window as any).initiateCall(selectedUser, callType);
      
      setOutgoingCall(true, {
        callId,
        callerId: currentUser.id,
        callerName: currentUser.name,
        receiverId: selectedUser.id,
        callType,
        timestamp: new Date().toISOString(),
        status: 'pending'
      });
    } catch (error) {
      console.error(`Error starting ${callType} call:`, error);
    }
  };

  if (!selectedUser || !currentUser) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Select a chat to start messaging</p>
      </div>
    );
  }

  const filteredMessages = messages.filter(msg => 
    (msg.senderId === currentUser.id && msg.receiverId === selectedUser.id) ||
    (msg.senderId === selectedUser.id && msg.receiverId === currentUser.id)
  );

  return (
    <div className="flex flex-col h-full bg-gray-50 select-none">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {showBackButton && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onBack}
                  className="-ml-2"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
              )}
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  {selectedUser.name[0].toUpperCase()}
                </div>
                {selectedUser.isOnline ? (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                ) : (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-gray-400 rounded-full border-2 border-white" />
                )}
              </div>
              <div>
                <h3 className="font-medium">{selectedUser.name}</h3>
                <p className="text-sm text-gray-500">
                  {selectedUser.isOnline ? 'Active now' : 'Offline'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className={`${selectedUser.isOnline ? 'text-[#46C8B6]' : 'text-gray-400'}`}
                onClick={() => handleCall('audio')}
                disabled={!selectedUser.isOnline}
                title={selectedUser.isOnline ? "Audio call" : `${selectedUser.name} is offline`}
              >
                <Phone className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className={`${selectedUser.isOnline ? 'text-[#46C8B6]' : 'text-gray-400'}`}
                onClick={() => handleCall('video')}
                disabled={!selectedUser.isOnline}
                title={selectedUser.isOnline ? "Video call" : `${selectedUser.name} is offline`}
              >
                <Video className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-600"
                onClick={onViewProfile}
              >
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div 
        ref={messageContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        <AnimatePresence initial={false}>
          {filteredMessages.map((message, index) => {
            const isSender = message.senderId === currentUser.id;
            const showAvatar = index === 0 || 
                             filteredMessages[index - 1].senderId !== message.senderId;
            
            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-end space-x-2 max-w-[70%] ${isSender ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  {showAvatar && !isSender && (
                    <div className="flex-shrink-0 mb-2">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm">
                        {selectedUser.name[0].toUpperCase()}
                      </div>
                    </div>
                  )}
                  <div className={`group relative rounded-2xl px-4 py-2 ${
                    isSender
                      ? 'bg-[#46C8B6] text-white rounded-br-none'
                      : 'bg-white text-gray-900 rounded-bl-none shadow-sm'
                  }`}>
                    <p className="break-words text-sm">{message.content}</p>
                    <div className={`text-[10px] ${isSender ? 'text-black' : 'text-black'} mt-1`}>
                      {new Date(message.timestamp).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>
      
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <Input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Message..."
            className="flex-1 bg-gray-50"
          />
          <Button 
            type="submit" 
            size="icon"
            disabled={!newMessage.trim()}
            className="bg-[#46C8B6] hover:bg-[#3baa9b] text-white rounded-full w-10 h-10 flex items-center justify-center"
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
