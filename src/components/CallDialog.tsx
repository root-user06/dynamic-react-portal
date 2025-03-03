
import React, { useEffect, useRef } from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { Button } from './ui/button';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { useCallStore } from '@/server/callStore';
import webRTCService from '@/server/webrtc';
import { useChatStore } from '@/lib/store';

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
  const [isMuted, setIsMuted] = React.useState(false);
  const [isVideoOff, setIsVideoOff] = React.useState(false);

  // Determine if the dialog should be open
  const isOpen = isIncomingCall || isOngoingCall || isOutgoingCall;

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
  const getTitle = () => {
    if (isIncomingCall) {
      return `Incoming ${currentCallData?.callType} call from ${currentCallData?.callerName}`;
    } else if (isOutgoingCall) {
      return `Calling ${selectedUser?.name}...`;
    } else if (isOngoingCall) {
      return `On a call with ${selectedUser?.name || currentCallData?.callerName}`;
    }
    return 'Call';
  };

  // Determine if it's a video call
  const isVideoCall = currentCallData?.callType === 'video';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        handleEndCall();
      }
    }}>
      <DialogContent className="sm:max-w-[500px] md:max-w-[700px] p-0 overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Call Header */}
          <div className="p-4 bg-gray-100 border-b">
            <h2 className="text-xl font-semibold">{getTitle()}</h2>
          </div>
          
          {/* Call Content */}
          <div className="relative flex-1 bg-gray-900 min-h-[400px]">
            {/* Remote Video (Full Screen) */}
            {isVideoCall && (isOngoingCall || isIncomingCall) && (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            )}
            
            {/* Audio-only Call Display */}
            {(!isVideoCall || !remoteStream) && (isOngoingCall || isIncomingCall || isOutgoingCall) && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center">
                  <span className="text-4xl text-white">
                    {selectedUser?.name?.[0]?.toUpperCase() || currentCallData?.callerName?.[0]?.toUpperCase() || '?'}
                  </span>
                </div>
              </div>
            )}
            
            {/* Local Video (Small Overlay) */}
            {isVideoCall && localStream && (
              <div className="absolute bottom-4 right-4 w-1/4 h-1/4 rounded-lg overflow-hidden border-2 border-white shadow-lg">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
          
          {/* Call Controls */}
          <div className="p-4 bg-gray-100 flex justify-center space-x-4">
            {isIncomingCall && !isOngoingCall && (
              <>
                <Button 
                  variant="destructive" 
                  className="rounded-full w-12 h-12 p-0" 
                  onClick={handleRejectCall}
                >
                  <PhoneOff size={20} />
                </Button>
                <Button 
                  variant="default" 
                  className="rounded-full w-12 h-12 p-0 bg-green-500 hover:bg-green-600" 
                  onClick={handleAcceptCall}
                >
                  <Phone size={20} />
                </Button>
              </>
            )}
            
            {(isOngoingCall || isOutgoingCall) && (
              <>
                <Button 
                  variant={isMuted ? "destructive" : "outline"} 
                  className="rounded-full w-12 h-12 p-0" 
                  onClick={toggleMute}
                >
                  {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                </Button>
                
                {isVideoCall && (
                  <Button 
                    variant={isVideoOff ? "destructive" : "outline"} 
                    className="rounded-full w-12 h-12 p-0" 
                    onClick={toggleVideo}
                  >
                    {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
                  </Button>
                )}
                
                <Button 
                  variant="destructive" 
                  className="rounded-full w-12 h-12 p-0" 
                  onClick={handleEndCall}
                >
                  <PhoneOff size={20} />
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CallDialog;
