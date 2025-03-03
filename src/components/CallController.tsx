
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
  const { currentUser, onlineUsers } = useChatStore();
  const { 
    setIncomingCall, 
    setOngoingCall,
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
        
        // Show toast notification
        toast({
          title: `Incoming ${callData.callType} call`,
          description: `${callData.callerName} is calling you`,
          duration: 5000,
        });
      });
      
      webRTCService.onCallAccepted((stream: MediaStream) => {
        console.log('Call accepted, received stream');
        setRemoteStream(stream);
        setOngoingCall(true);
      });
      
      webRTCService.onCallEnded(() => {
        console.log('Call ended');
        resetCallState();
      });
      
      // Cleanup on unmount
      return () => {
        webRTCService.cleanup();
      };
    }
  }, [currentUser, onlineUsers, setIncomingCall, setOngoingCall, setRemoteStream, resetCallState, toast, setRemoteUser]);

  // Handle call initiation
  const handleInitiateCall = async (receiver: User, callType: 'audio' | 'video') => {
    if (!currentUser) return;
    
    try {
      // Start the call
      const callId = await webRTCService.startCall(receiver, callType);
      
      // Get local stream and update state
      if (webRTCService['myStream']) {
        setLocalStream(webRTCService['myStream']);
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
      
      // Send notification
      await notificationService.sendCallNotification(
        currentUser.id,
        receiver.id,
        callType,
        callId
      );
      
      return callId;
    } catch (error) {
      console.error('Error initiating call:', error);
      throw error;
    }
  };

  // Expose the method to the global window object for other components to access
  if (typeof window !== 'undefined') {
    (window as any).initiateCall = handleInitiateCall;
  }

  return null; // This component doesn't render anything
};

export default CallController;
