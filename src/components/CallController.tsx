
import { useEffect } from 'react';
import { useCallStore } from '@/server/callStore';
import webRTCService, { CallData } from '@/server/webrtc';
import notificationService from '@/server/notifications';
import { useChatStore } from '@/lib/store';
import { useToast } from './ui/use-toast';
import { User } from '@/lib/types';

// This component doesn't render anything, it just sets up call-related listeners
const CallController = () => {
  const { toast } = useToast();
  const { currentUser, onlineUsers, addMessage } = useChatStore();
  const { 
    setIncomingCall, 
    setOngoingCall,
    setOutgoingCall,
    setRemoteStream,
    setLocalStream,
    resetCallState,
    setRemoteUser
  } = useCallStore();

  // Initialize WebRTC when user logs in
  useEffect(() => {
    if (currentUser) {
      // Initialize WebRTC service with current user
      webRTCService.initialize(currentUser)
        .then(() => {
          console.log('WebRTC initialized for user:', currentUser.id);
          
          // Request notification permission
          return notificationService.requestPermission(currentUser);
        })
        .catch(error => {
          console.error('Error initializing call services:', error);
        });
      
      // Set up listeners
      webRTCService.onIncomingCall((callData: CallData) => {
        console.log('Incoming call:', callData);
        
        // Find caller user object from online users
        const caller = onlineUsers.find(user => user.id === callData.callerId);
        
        if (caller) {
          setRemoteUser(caller);
        }
        
        // Update call state
        setIncomingCall(true, callData);
        
        // Play notification sound
        const audio = new Audio('/sounds/incoming-call.mp3');
        audio.play().catch(err => console.error('Error playing notification sound:', err));
        
        // Show toast notification with action buttons
        toast({
          title: `Incoming ${callData.callType} call`,
          description: `${callData.callerName} is calling you`,
          action: (
            <div className="flex gap-2 mt-2">
              <button 
                onClick={() => webRTCService.rejectCall()}
                className="px-3 py-1 bg-red-500 text-white rounded-full text-xs"
              >
                Decline
              </button>
              <button 
                onClick={() => webRTCService.acceptCall()}
                className="px-3 py-1 bg-green-500 text-white rounded-full text-xs"
              >
                Answer
              </button>
            </div>
          ),
          duration: 10000,
        });
      });
      
      webRTCService.onCallAccepted((stream: MediaStream) => {
        console.log('Call accepted, received stream');
        setRemoteStream(stream);
        setOngoingCall(true);
        
        // Add call started message
        if (currentUser) {
          const callData = webRTCService['currentCall'];
          if (callData) {
            const callerId = callData.callerId;
            const receiverId = callData.receiverId;
            
            // Add a call message to the chat
            addMessage({
              id: `call-${Date.now()}`,
              senderId: currentUser.id,
              receiverId: currentUser.id === callerId ? receiverId : callerId,
              content: `Call started`,
              timestamp: new Date().toISOString(),
              isRead: true,
              callType: callData.callType,
              callStatus: 'started'
            });
          }
        }
      });
      
      webRTCService.onCallEnded(() => {
        console.log('Call ended');
        
        // Add call ended message
        if (currentUser) {
          const callData = webRTCService['currentCall'];
          if (callData) {
            const callerId = callData.callerId;
            const receiverId = callData.receiverId;
            
            // Add a call message to the chat
            addMessage({
              id: `call-end-${Date.now()}`,
              senderId: currentUser.id,
              receiverId: currentUser.id === callerId ? receiverId : callerId,
              content: `Call ended`,
              timestamp: new Date().toISOString(),
              isRead: true,
              callType: callData.callType,
              callStatus: 'ended'
            });
          }
        }
        
        resetCallState();
      });
      
      // Cleanup on unmount
      return () => {
        webRTCService.cleanup();
      };
    }
  }, [currentUser, onlineUsers, setIncomingCall, setOngoingCall, setRemoteStream, resetCallState, toast, setRemoteUser, addMessage]);

  // Handle call initiation
  const handleInitiateCall = async (receiver: User, callType: 'audio' | 'video') => {
    if (!currentUser) return;
    
    try {
      // Start the call
      const callId = await webRTCService.startCall(receiver, callType);
      
      // Get local stream and update state
      if (webRTCService['localStream']) {
        setLocalStream(webRTCService['localStream']);
      }
      
      // Create call data
      const callData: CallData = {
        callId,
        callerId: currentUser.id,
        callerName: currentUser.name,
        receiverId: receiver.id,
        callType,
        timestamp: new Date().toISOString(),
        status: 'pending'
      };
      
      // Update call state
      setRemoteUser(receiver);
      setOutgoingCall(true, callData);
      
      // Play outgoing call sound
      const audio = new Audio('/sounds/outgoing-call.mp3');
      audio.loop = true;
      audio.play().catch(err => console.error('Error playing outgoing call sound:', err));
      
      // Send notification
      await notificationService.sendCallNotification(
        currentUser.id,
        receiver.id,
        callType,
        callId
      );
      
      // Add outgoing call message
      addMessage({
        id: `call-${Date.now()}`,
        senderId: currentUser.id,
        receiverId: receiver.id,
        content: `Outgoing ${callType} call`,
        timestamp: new Date().toISOString(),
        isRead: true,
        callType,
        callStatus: 'outgoing'
      });
      
      return callId;
    } catch (error) {
      console.error('Error initiating call:', error);
      throw error;
    }
  };

  // Add call buttons to the chat window for the selected user
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Add call buttons to ChatWindow
      const addCallButtons = () => {
        const chatHeader = document.querySelector('.chat-header-actions');
        
        if (chatHeader && !document.querySelector('.call-buttons')) {
          const callButtons = document.createElement('div');
          callButtons.className = 'call-buttons flex gap-2';
          
          const audioCallButton = document.createElement('button');
          audioCallButton.className = 'p-2 rounded-full hover:bg-gray-200 transition-colors';
          audioCallButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-phone"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>';
          audioCallButton.addEventListener('click', () => {
            const receiver = (window as any).chatStore?.getState()?.selectedUser;
            if (receiver) {
              (window as any).initiateCall(receiver, 'audio');
            }
          });
          
          const videoCallButton = document.createElement('button');
          videoCallButton.className = 'p-2 rounded-full hover:bg-gray-200 transition-colors';
          videoCallButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-video"><path d="m22 8-6 4 6 4V8Z"></path><rect width="14" height="12" x="2" y="6" rx="2" ry="2"></rect></svg>';
          videoCallButton.addEventListener('click', () => {
            const receiver = (window as any).chatStore?.getState()?.selectedUser;
            if (receiver) {
              (window as any).initiateCall(receiver, 'video');
            }
          });
          
          callButtons.appendChild(audioCallButton);
          callButtons.appendChild(videoCallButton);
          chatHeader.appendChild(callButtons);
        }
      };
      
      // Try to add buttons on load and after DOM changes
      addCallButtons();
      const observer = new MutationObserver(addCallButtons);
      observer.observe(document.body, { childList: true, subtree: true });
      
      return () => {
        observer.disconnect();
      };
    }
  }, []);

  // Expose the method to the global window object for other components to access
  if (typeof window !== 'undefined') {
    (window as any).initiateCall = handleInitiateCall;
    (window as any).chatStore = useChatStore;
  }

  return null; // This component doesn't render anything
};

export default CallController;
