
import { useState, useRef, useEffect } from 'react';
import { useChatStore } from '@/lib/store';
import { Message } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, MoreVertical, Phone, Video, ChevronLeft, Check, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import AudioCallUI from './AudioCallUI';
import VideoCallUI from './VideoCallUI';
import CallNotification from './CallNotification';
import CallService from '@/lib/CallService';
import { MediaConnection } from 'peerjs';
import { toast } from '@/hooks/use-toast';

interface ChatWindowProps {
  showBackButton?: boolean;
  onBack?: () => void;
  onViewProfile?: () => void;
}

const ChatWindow = ({ showBackButton, onBack, onViewProfile }: ChatWindowProps) => {
  const [newMessage, setNewMessage] = useState('');
  const { messages, currentUser, selectedUser, addMessage, setMessageRead } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  
  // Call states
  const [isInAudioCall, setIsInAudioCall] = useState(false);
  const [isInVideoCall, setIsInVideoCall] = useState(false);
  const [activeCall, setActiveCall] = useState<MediaConnection | null>(null);
  const [incomingCall, setIncomingCall] = useState<{
    call: MediaConnection;
    caller: any;
    type: 'audio' | 'video';
  } | null>(null);
  const [callService] = useState(() => CallService.getInstance());
  const [ringtone] = useState(new Audio('/ringtone.mp3'));
  const [callSound] = useState(new Audio('/ringing.mp3'));
  const [callInitialized, setCallInitialized] = useState(false);

  // Initialize call service
  useEffect(() => {
    if (currentUser && !callInitialized) {
      callService.initialize()
        .then(peerId => {
          console.log(`Call service initialized with ID: ${peerId}`);
          setCallInitialized(true);
          
          // Set up event listeners
          callService.addIncomingCallListener(handleIncomingCall);
          callService.addCallEndedListener(handleCallEnded);
        })
        .catch(err => console.error("Failed to initialize call service:", err));
      
      return () => {
        callService.removeIncomingCallListener(handleIncomingCall);
        callService.removeCallEndedListener(handleCallEnded);
      };
    }
  }, [currentUser, callInitialized]);

  const handleIncomingCall = (incoming: { call: MediaConnection; caller: any; type: 'audio' | 'video' }) => {
    console.log("Incoming call from:", incoming.caller.name, "Type:", incoming.type);
    
    // Stop any other sounds playing
    ringtone.pause();
    ringtone.currentTime = 0;
    
    // Play ringtone
    ringtone.loop = true;
    ringtone.play().catch(err => console.error("Error playing ringtone:", err));
    
    setIncomingCall(incoming);
    
    // Auto-reject call after 30 seconds if not answered
    setTimeout(() => {
      setIncomingCall(prev => {
        if (prev && prev.call.connectionId === incoming.call.connectionId) {
          ringtone.pause();
          ringtone.currentTime = 0;
          return null;
        }
        return prev;
      });
    }, 30000);
  };

  const handleCallEnded = () => {
    console.log("Call ended");
    setIsInAudioCall(false);
    setIsInVideoCall(false);
    setActiveCall(null);
    
    // Stop all sounds
    ringtone.pause();
    ringtone.currentTime = 0;
    callSound.pause();
    callSound.currentTime = 0;
    
    toast({
      title: "Call ended",
      duration: 3000
    });
  };

  const initiateAudioCall = async () => {
    if (!selectedUser || !currentUser) return;
    
    try {
      // Play call sound
      callSound.loop = true;
      callSound.play().catch(err => console.error("Error playing call sound:", err));
      
      // Get user's peer ID
      const remotePeerId = selectedUser.id; // Using user ID as peer ID for simplicity
      
      // Initiate call
      const call = await callService.callUser(currentUser, remotePeerId, 'audio');
      setActiveCall(call);
      setIsInAudioCall(true);
      
      // Create a call message
      sendCallMessage('audio', 'outgoing');
    } catch (error) {
      console.error("Failed to initiate audio call:", error);
      toast({
        title: "Call failed",
        description: "Could not connect to the user",
        variant: "destructive"
      });
      callSound.pause();
      callSound.currentTime = 0;
    }
  };

  const initiateVideoCall = async () => {
    if (!selectedUser || !currentUser) return;
    
    try {
      // Play call sound
      callSound.loop = true;
      callSound.play().catch(err => console.error("Error playing call sound:", err));
      
      // Get user's peer ID
      const remotePeerId = selectedUser.id; // Using user ID as peer ID for simplicity
      
      // Initiate call
      const call = await callService.callUser(currentUser, remotePeerId, 'video');
      setActiveCall(call);
      setIsInVideoCall(true);
      
      // Create a call message
      sendCallMessage('video', 'outgoing');
    } catch (error) {
      console.error("Failed to initiate video call:", error);
      toast({
        title: "Call failed",
        description: "Could not connect to the user",
        variant: "destructive"
      });
      callSound.pause();
      callSound.currentTime = 0;
    }
  };

  const acceptIncomingCall = async () => {
    if (!incomingCall) return;
    
    try {
      // Stop ringtone
      ringtone.pause();
      ringtone.currentTime = 0;
      
      // Answer the call
      await callService.answerCall(incomingCall.call, incomingCall.type);
      setActiveCall(incomingCall.call);
      
      // Set the appropriate call state
      if (incomingCall.type === 'audio') {
        setIsInAudioCall(true);
      } else {
        setIsInVideoCall(true);
      }
      
      // Clear incoming call notification
      setIncomingCall(null);
      
      // Create a call message
      sendCallMessage(incomingCall.type, 'incoming');
    } catch (error) {
      console.error("Failed to accept call:", error);
      toast({
        title: "Call failed",
        description: "Could not connect to the call",
        variant: "destructive"
      });
      setIncomingCall(null);
    }
  };

  const rejectIncomingCall = () => {
    if (!incomingCall) return;
    
    // Stop ringtone
    ringtone.pause();
    ringtone.currentTime = 0;
    
    // Create a missed call message
    sendCallMessage(incomingCall.type, 'missed');
    
    // Clear incoming call notification
    setIncomingCall(null);
  };

  const endCall = () => {
    // Stop call sound
    callSound.pause();
    callSound.currentTime = 0;
    
    // End the call
    callService.endCurrentCall();
  };

  const sendCallMessage = (callType: 'audio' | 'video', callStatus: 'started' | 'ended' | 'missed' | 'outgoing' | 'incoming') => {
    if (!currentUser || !selectedUser) return;
    
    const message: Message = {
      id: uuidv4(),
      senderId: currentUser.id,
      receiverId: selectedUser.id,
      content: `${callType === 'audio' ? 'Audio' : 'Video'} call ${callStatus}`,
      timestamp: new Date().toISOString(),
      isRead: false,
      callType,
      callStatus
    };
    
    addMessage(message);
  };

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

  // Mark messages as read when they appear in the chat window
  useEffect(() => {
    if (selectedUser && currentUser) {
      const unreadMessages = messages.filter(
        msg => msg.senderId === selectedUser.id && 
               msg.receiverId === currentUser.id && 
               !msg.isRead
      );
      
      unreadMessages.forEach(msg => {
        setMessageRead(msg.id);
      });
    }
  }, [messages, selectedUser, currentUser, setMessageRead]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && currentUser && selectedUser) {
      const message: Message = {
        id: uuidv4(),
        senderId: currentUser.id,
        receiverId: selectedUser.id,
        content: newMessage.trim(),
        timestamp: new Date().toISOString(),
        isRead: false,
        isDelivered: false
      };
      addMessage(message);
      setNewMessage('');
    }
  };

  const renderMessageStatus = (message: Message) => {
    if (message.senderId !== currentUser?.id) return null;
    
    if (message.isRead) {
      return <CheckCheck className="h-3.5 w-3.5 text-blue-500" />;
    } else if (message.isDelivered) {
      return <Check className="h-3.5 w-3.5 text-gray-400" />;
    }
    
    return null;
  };

  const renderCallMessage = (message: Message) => {
    if (!message.callType || !message.callStatus) return null;
    
    const isMyMessage = message.senderId === currentUser?.id;
    
    return (
      <div className={`flex items-center justify-center my-2 ${isMyMessage ? 'text-right' : 'text-left'}`}>
        <div className="bg-gray-100 px-3 py-1 rounded-full inline-flex items-center gap-2 text-sm text-gray-600">
          {message.callType === 'audio' ? (
            <Phone className="h-3.5 w-3.5" />
          ) : (
            <Video className="h-3.5 w-3.5" />
          )}
          <span>
            {message.callStatus === 'outgoing' && isMyMessage && "Outgoing call"}
            {message.callStatus === 'outgoing' && !isMyMessage && "Call from you"}
            {message.callStatus === 'incoming' && isMyMessage && "Call to you"}
            {message.callStatus === 'incoming' && !isMyMessage && "Incoming call"}
            {message.callStatus === 'missed' && isMyMessage && "Call missed"}
            {message.callStatus === 'missed' && !isMyMessage && "Missed call"}
            {message.callStatus === 'ended' && "Call ended"}
          </span>
          <span className="text-xs opacity-70">
            {new Date(message.timestamp).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
        </div>
      </div>
    );
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
      {/* Incoming call notification */}
      {incomingCall && (
        <CallNotification
          caller={incomingCall.caller}
          callType={incomingCall.type}
          onAccept={acceptIncomingCall}
          onReject={rejectIncomingCall}
        />
      )}
      
      {/* Active call UIs */}
      {isInAudioCall && (
        <AudioCallUI
          peer={callService.peer!}
          call={activeCall}
          remoteUser={selectedUser}
          onEndCall={endCall}
          outgoing={activeCall?.metadata?.user?.id === currentUser.id}
        />
      )}
      
      {isInVideoCall && (
        <VideoCallUI
          peer={callService.peer!}
          call={activeCall}
          remoteUser={selectedUser}
          onEndCall={endCall}
          outgoing={activeCall?.metadata?.user?.id === currentUser.id}
        />
      )}
      
      {/* Chat header */}
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
                {selectedUser.isOnline && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
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
                className="text-[#46C8B6]"
                onClick={initiateAudioCall}
              >
                <Phone className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-[#46C8B6]"
                onClick={initiateVideoCall}
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

      {/* Messages area */}
      <div 
        ref={messageContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        <AnimatePresence initial={false}>
          {filteredMessages.map((message, index) => {
            const isSender = message.senderId === currentUser.id;
            const showAvatar = index === 0 || 
                             filteredMessages[index - 1].senderId !== message.senderId;
            
            // If it's a call message, render it differently
            if (message.callType) {
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  {renderCallMessage(message)}
                </motion.div>
              );
            }
            
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
                    <div className={`text-[10px] ${isSender ? 'text-black' : 'text-black'} mt-1 flex items-center justify-end space-x-1`}>
                      <span>
                        {new Date(message.timestamp).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                      {renderMessageStatus(message)}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message input */}
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
