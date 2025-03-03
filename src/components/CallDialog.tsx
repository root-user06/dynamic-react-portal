
import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { Button } from './ui/button';
import { ArrowLeft, Phone, PhoneOff, Mic, MicOff, Video, VideoOff, X } from 'lucide-react';
import { useCallStore } from '@/server/callStore';
import webRTCService from '@/server/webrtc';
import { useChatStore } from '@/lib/store';
import { Avatar } from './ui/avatar';
import { cn } from '@/lib/utils';

const CallDialog = () => {
  const { 
    isIncomingCall, 
    isOngoingCall, 
    isOutgoingCall,
    currentCallData,
    remoteStream,
    localStream,
    resetCallState
  } = useCallStore();

  const { selectedUser, currentUser } = useChatStore();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const incomingCallSoundRef = useRef<HTMLAudioElement>(null);
  const outgoingCallSoundRef = useRef<HTMLAudioElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  // Determine if the dialog should be open
  const isOpen = isIncomingCall || isOngoingCall || isOutgoingCall;
  const isVideoCall = currentCallData?.callType === 'video';

  // Get remote user (either the caller or the called user)
  const remoteUser = selectedUser || 
    (currentCallData?.callerId !== currentUser?.id ? 
      { id: currentCallData?.callerId || '', name: currentCallData?.callerName || '' } : 
      { id: currentCallData?.receiverId || '', name: 'User' });

  // Get the call background gradient based on call type
  const getCallBackground = () => {
    if (isVideoCall && remoteStream) {
      return 'bg-gray-900'; // Video will be shown as background
    } else if (isIncomingCall || isOutgoingCall) {
      return 'bg-gradient-to-b from-purple-400 to-indigo-600'; // Purple gradient for incoming/outgoing calls
    } else {
      return 'bg-gradient-to-b from-teal-400 to-cyan-600'; // Teal gradient for ongoing calls
    }
  };

  // Play or pause call sounds based on call state
  useEffect(() => {
    if (incomingCallSoundRef.current && outgoingCallSoundRef.current) {
      if (isIncomingCall) {
        incomingCallSoundRef.current.loop = true;
        incomingCallSoundRef.current.play().catch(error => console.log('Error playing sound:', error));
        outgoingCallSoundRef.current.pause();
      } else if (isOutgoingCall) {
        outgoingCallSoundRef.current.loop = true;
        outgoingCallSoundRef.current.play().catch(error => console.log('Error playing sound:', error));
        incomingCallSoundRef.current.pause();
      } else {
        incomingCallSoundRef.current.pause();
        outgoingCallSoundRef.current.pause();
      }
    }

    return () => {
      if (incomingCallSoundRef.current && outgoingCallSoundRef.current) {
        incomingCallSoundRef.current.pause();
        outgoingCallSoundRef.current.pause();
      }
    };
  }, [isIncomingCall, isOutgoingCall, isOngoingCall]);

  // Set up streams for video elements
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
    
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [localStream, remoteStream]);

  // Handle call acceptance
  const handleAcceptCall = async () => {
    try {
      await webRTCService.acceptCall();
    } catch (error) {
      console.error('Error accepting call:', error);
    }
  };

  // Handle call rejection
  const handleRejectCall = async () => {
    try {
      await webRTCService.rejectCall();
      resetCallState();
    } catch (error) {
      console.error('Error rejecting call:', error);
    }
  };

  // Handle call end
  const handleEndCall = async () => {
    try {
      await webRTCService.endCall();
      resetCallState();
    } catch (error) {
      console.error('Error ending call:', error);
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  // Determine the dialog title based on call state
  const getCallStatus = () => {
    if (isIncomingCall) {
      return `${currentCallData?.callType === 'video' ? 'Video' : 'Audio'} call from ${currentCallData?.callerName}`;
    } else if (isOutgoingCall) {
      return `Calling...`;
    } else if (isOngoingCall) {
      return `${remoteUser?.name || ''}`;
    }
    return '';
  };

  // Render incoming call UI (similar to the 4th reference image)
  const renderIncomingCall = () => (
    <div className="flex flex-col h-full items-center justify-between p-4">
      <div className="flex flex-col items-center mt-12 space-y-4">
        <Avatar className="w-32 h-32 border-4 border-white">
          <img 
            src={remoteUser?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(remoteUser?.name || 'User')}&background=random&color=fff`} 
            alt={remoteUser?.name} 
            className="w-full h-full object-cover"
          />
        </Avatar>
        <h2 className="text-2xl font-bold text-white">{remoteUser?.name}</h2>
        <p className="text-white opacity-80">
          {currentCallData?.callType === 'video' ? 'Video call from Messenger' : 'Audio call from Messenger'}
        </p>
      </div>
      
      <div className="flex justify-center space-x-8 mb-12">
        <button 
          className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center"
          onClick={handleRejectCall}
        >
          <X className="w-8 h-8 text-white" />
          <span className="sr-only">Decline</span>
        </button>
        <button 
          className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center"
          onClick={handleAcceptCall}
        >
          <Phone className="w-8 h-8 text-white" />
          <span className="sr-only">Answer</span>
        </button>
      </div>
    </div>
  );

  // Render outgoing call UI (similar to the 1st reference image)
  const renderOutgoingCall = () => (
    <div className="flex flex-col h-full items-center justify-between p-4">
      <div className="flex items-center justify-between w-full pt-4">
        <Button variant="ghost" className="text-white" onClick={handleEndCall}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <div className="flex space-x-4">
          {/* Optional buttons */}
        </div>
      </div>
      
      <div className="flex flex-col items-center space-y-4">
        <Avatar className="w-32 h-32 border-4 border-white">
          <img 
            src={remoteUser?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(remoteUser?.name || 'User')}&background=random&color=fff`} 
            alt={remoteUser?.name} 
            className="w-full h-full object-cover"
          />
        </Avatar>
        <h2 className="text-2xl font-bold text-white">{remoteUser?.name}</h2>
        <p className="text-white opacity-80">Calling...</p>
      </div>
      
      <div className="flex justify-center space-x-3 mb-8 rounded-full bg-gray-800 bg-opacity-30 p-3">
        {isVideoCall && (
          <button 
            className={cn("w-14 h-14 rounded-full flex items-center justify-center", 
              isVideoOff ? "bg-red-500" : "bg-gray-700")}
            onClick={toggleVideo}
          >
            {isVideoOff ? 
              <VideoOff className="w-6 h-6 text-white" /> : 
              <Video className="w-6 h-6 text-white" />
            }
          </button>
        )}
        <button 
          className={cn("w-14 h-14 rounded-full flex items-center justify-center", 
            isMuted ? "bg-red-500" : "bg-gray-700")}
          onClick={toggleMute}
        >
          {isMuted ? 
            <MicOff className="w-6 h-6 text-white" /> : 
            <Mic className="w-6 h-6 text-white" />
          }
        </button>
        <button 
          className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center"
          onClick={handleEndCall}
        >
          <PhoneOff className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  );

  // Render ongoing video call UI (similar to the 5th reference image)
  const renderOngoingVideoCall = () => (
    <div className="relative flex flex-col h-full">
      <div className="absolute inset-0">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
      </div>
      
      {localStream && (
        <div className="absolute top-4 right-4 w-1/3 h-1/4 rounded-lg overflow-hidden border-2 border-white shadow-lg z-10">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="absolute top-4 left-4 z-10">
        <Button variant="ghost" className="text-white" onClick={handleEndCall}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
      </div>
      
      <div className="absolute bottom-8 left-0 right-0 flex justify-center space-x-3">
        <button 
          className={cn("w-14 h-14 rounded-full flex items-center justify-center", 
            isVideoOff ? "bg-red-500" : "bg-gray-700")}
          onClick={toggleVideo}
        >
          {isVideoOff ? 
            <VideoOff className="w-6 h-6 text-white" /> : 
            <Video className="w-6 h-6 text-white" />
          }
        </button>
        <button 
          className={cn("w-14 h-14 rounded-full flex items-center justify-center", 
            isMuted ? "bg-red-500" : "bg-gray-700")}
          onClick={toggleMute}
        >
          {isMuted ? 
            <MicOff className="w-6 h-6 text-white" /> : 
            <Mic className="w-6 h-6 text-white" />
          }
        </button>
        <button 
          className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center"
          onClick={handleEndCall}
        >
          <PhoneOff className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  );

  // Render ongoing audio call UI
  const renderOngoingAudioCall = () => (
    <div className="flex flex-col h-full items-center justify-between p-4">
      <div className="flex items-center justify-between w-full pt-4">
        <Button variant="ghost" className="text-white" onClick={handleEndCall}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
      </div>
      
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <Avatar className="w-32 h-32 border-4 border-white">
            <img 
              src={remoteUser?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(remoteUser?.name || 'User')}&background=random&color=fff`} 
              alt={remoteUser?.name} 
              className="w-full h-full object-cover"
            />
          </Avatar>
          <div className="absolute inset-0 pulse-ring"></div>
        </div>
        <h2 className="text-2xl font-bold text-white">{remoteUser?.name}</h2>
        <p className="text-white opacity-80">
          {isOngoingCall ? 'Ongoing call' : 'Connecting...'}
        </p>
      </div>
      
      <div className="flex justify-center space-x-3 mb-8 rounded-full bg-gray-800 bg-opacity-30 p-3">
        <button 
          className={cn("w-14 h-14 rounded-full flex items-center justify-center", 
            isMuted ? "bg-red-500" : "bg-gray-700")}
          onClick={toggleMute}
        >
          {isMuted ? 
            <MicOff className="w-6 h-6 text-white" /> : 
            <Mic className="w-6 h-6 text-white" />
          }
        </button>
        <button 
          className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center"
          onClick={handleEndCall}
        >
          <PhoneOff className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Hidden audio elements for call sounds */}
      <audio ref={incomingCallSoundRef} src="/sounds/incoming-call.mp3" />
      <audio ref={outgoingCallSoundRef} src="/sounds/outgoing-call.mp3" />
      
      <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
          handleEndCall();
        }
      }}>
        <DialogContent className="sm:max-w-[500px] md:max-w-[700px] p-0 overflow-hidden mobile-call-dialog">
          <div className={`flex flex-col h-full min-h-[80vh] ${getCallBackground()}`}>
            {isIncomingCall && !isOngoingCall && renderIncomingCall()}
            {isOutgoingCall && !isOngoingCall && renderOutgoingCall()}
            {isOngoingCall && isVideoCall && renderOngoingVideoCall()}
            {isOngoingCall && !isVideoCall && renderOngoingAudioCall()}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CallDialog;
