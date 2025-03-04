
import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { Button } from './ui/button';
import { ArrowLeft, Phone, PhoneOff, Mic, MicOff, Video, VideoOff, X } from 'lucide-react';
import { useCallStore } from '@/lib/callStore';
import webRTCService from '@/lib/webrtc';
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
    remoteUser,
    resetCallState
  } = useCallStore();

  const { currentUser } = useChatStore();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const isOpen = isIncomingCall || isOngoingCall || isOutgoingCall;
  const isVideoCall = currentCallData?.callType === 'video';

  const displayName = remoteUser?.name || currentCallData?.callerName || 'User';

  const getCallBackground = () => {
    if (isVideoCall && remoteStream) {
      return 'bg-gray-900';
    } else if (isIncomingCall) {
      return 'bg-gradient-to-b from-blue-50 to-blue-100';
    } else if (isOutgoingCall) {
      return 'bg-gradient-to-b from-purple-50 to-purple-100';
    } else {
      return 'bg-gradient-to-b from-blue-50 to-blue-100';
    }
  };

  // Handle media streams
  useEffect(() => {
    console.log('Setting up video streams, remote stream:', !!remoteStream, 'local stream:', !!localStream);
    
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
    
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [localStream, remoteStream, isVideoCall]);

  const handleAcceptCall = async () => {
    console.log('Accepting call');
    try {
      await webRTCService.acceptCall();
    } catch (error) {
      console.error('Error accepting call:', error);
    }
  };

  const handleRejectCall = async () => {
    console.log('Rejecting call');
    try {
      await webRTCService.rejectCall();
      resetCallState();
    } catch (error) {
      console.error('Error rejecting call:', error);
    }
  };

  const handleEndCall = async () => {
    console.log('Ending call');
    try {
      await webRTCService.endCall();
      resetCallState();
    } catch (error) {
      console.error('Error ending call:', error);
    }
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream && isVideoCall) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const getCallStatus = () => {
    if (isIncomingCall) {
      return `${currentCallData?.callType === 'video' ? 'Video' : 'Audio'} call from ${currentCallData?.callerName}`;
    } else if (isOutgoingCall) {
      return `Calling...`;
    } else if (isOngoingCall) {
      return `${displayName}`;
    }
    return '';
  };

  // Render incoming call UI (modern light theme)
  const renderIncomingCall = () => (
    <div className="flex flex-col h-full items-center justify-between p-4">
      <div className="flex flex-col items-center mt-12 space-y-4">
        <div className="w-32 h-32 relative">
          <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
            <img 
              src={remoteUser?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&color=fff`} 
              alt={displayName} 
              className="w-full h-full object-cover"
            />
          </Avatar>
          <div className="absolute inset-0 pulse-ring opacity-70"></div>
        </div>
        <h2 className="text-2xl font-bold text-gray-800">{displayName}</h2>
        <p className="text-gray-600">
          {currentCallData?.callType === 'video' ? 'Video call from Messenger' : 'Audio call from Messenger'}
        </p>
      </div>
      
      <div className="flex justify-center space-x-8 mb-12">
        <button 
          className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
          onClick={handleRejectCall}
        >
          <X className="w-8 h-8 text-white" />
          <span className="sr-only">Decline</span>
        </button>
        <button 
          className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center shadow-lg hover:bg-green-600 transition-colors"
          onClick={handleAcceptCall}
        >
          <Phone className="w-8 h-8 text-white" />
          <span className="sr-only">Answer</span>
        </button>
      </div>
    </div>
  );

  // Render outgoing call UI (modern light theme)
  const renderOutgoingCall = () => (
    <div className="flex flex-col h-full items-center justify-between p-4">
      <div className="flex items-center justify-between w-full pt-4">
        <Button variant="ghost" className="text-gray-800" onClick={handleEndCall}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
      </div>
      
      <div className="flex flex-col items-center space-y-4">
        <div className="w-32 h-32 relative">
          <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
            <img 
              src={remoteUser?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&color=fff`} 
              alt={displayName} 
              className="w-full h-full object-cover"
            />
          </Avatar>
          <div className="absolute inset-0 pulse-ring opacity-70"></div>
        </div>
        <h2 className="text-2xl font-bold text-gray-800">{displayName}</h2>
        <p className="text-gray-600">Calling...</p>
      </div>
      
      <div className="flex justify-center space-x-3 mb-8 p-3">
        {isVideoCall && (
          <button 
            className={cn("w-14 h-14 rounded-full flex items-center justify-center shadow-lg", 
              isVideoOff ? "bg-red-500" : "bg-blue-500 hover:bg-blue-600")}
            onClick={toggleVideo}
          >
            {isVideoOff ? 
              <VideoOff className="w-6 h-6 text-white" /> : 
              <Video className="w-6 h-6 text-white" />
            }
          </button>
        )}
        <button 
          className={cn("w-14 h-14 rounded-full flex items-center justify-center shadow-lg", 
            isMuted ? "bg-red-500" : "bg-blue-500 hover:bg-blue-600")}
          onClick={toggleMute}
        >
          {isMuted ? 
            <MicOff className="w-6 h-6 text-white" /> : 
            <Mic className="w-6 h-6 text-white" />
          }
        </button>
        <button 
          className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
          onClick={handleEndCall}
        >
          <PhoneOff className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  );

  // Render ongoing video call UI (optimized for mobile)
  const renderOngoingVideoCall = () => (
    <div className="relative flex flex-col h-full">
      <div className="absolute inset-0 bg-black">
        {remoteStream && (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        )}
      </div>
      
      {localStream && isVideoCall && (
        <div className="absolute top-4 right-4 w-1/3 h-1/4 max-w-[120px] max-h-[160px] rounded-lg overflow-hidden border-2 border-white shadow-lg z-10">
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
        <Button variant="ghost" className="text-white bg-black/30 backdrop-blur-sm rounded-full" onClick={handleEndCall}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
      </div>
      
      <div className="absolute bottom-8 left-0 right-0 flex justify-center space-x-4">
        <button 
          className={cn("w-14 h-14 rounded-full flex items-center justify-center shadow-lg", 
            isVideoOff ? "bg-red-500" : "bg-blue-500")}
          onClick={toggleVideo}
        >
          {isVideoOff ? 
            <VideoOff className="w-6 h-6 text-white" /> : 
            <Video className="w-6 h-6 text-white" />
          }
        </button>
        <button 
          className={cn("w-14 h-14 rounded-full flex items-center justify-center shadow-lg", 
            isMuted ? "bg-red-500" : "bg-blue-500")}
          onClick={toggleMute}
        >
          {isMuted ? 
            <MicOff className="w-6 h-6 text-white" /> : 
            <Mic className="w-6 h-6 text-white" />
          }
        </button>
        <button 
          className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center shadow-lg"
          onClick={handleEndCall}
        >
          <PhoneOff className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  );

  // Render ongoing audio call UI (modern light theme)
  const renderOngoingAudioCall = () => (
    <div className="flex flex-col h-full items-center justify-between p-4">
      <div className="flex items-center justify-between w-full pt-4">
        <Button variant="ghost" className="text-gray-800" onClick={handleEndCall}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
      </div>
      
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
            <img 
              src={remoteUser?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&color=fff`} 
              alt={displayName} 
              className="w-full h-full object-cover"
            />
          </Avatar>
          <div className="absolute inset-0 pulse-ring"></div>
        </div>
        <h2 className="text-2xl font-bold text-gray-800">{displayName}</h2>
        <p className="text-gray-600">
          {isOngoingCall ? 'Ongoing call' : 'Connecting...'}
        </p>
      </div>
      
      <div className="flex justify-center space-x-4 mb-8">
        <button 
          className={cn("w-14 h-14 rounded-full flex items-center justify-center shadow-lg", 
            isMuted ? "bg-red-500" : "bg-blue-500 hover:bg-blue-600")}
          onClick={toggleMute}
        >
          {isMuted ? 
            <MicOff className="w-6 h-6 text-white" /> : 
            <Mic className="w-6 h-6 text-white" />
          }
        </button>
        <button 
          className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
          onClick={handleEndCall}
        >
          <PhoneOff className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  );

  // Add a pulse animation to the CSS
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0% {
          transform: scale(1);
          opacity: 0.8;
        }
        70% {
          transform: scale(1.1);
          opacity: 0.4;
        }
        100% {
          transform: scale(1);
          opacity: 0.8;
        }
      }
      
      .pulse-ring {
        border-radius: 50%;
        border: 3px solid #46C8B6;
        animation: pulse 2s infinite;
      }
      
      .mobile-call-dialog {
        max-width: 100vw !important;
        max-height: 100vh !important;
        height: 100vh;
        margin: 0;
        padding: 0;
        width: 100vw;
        border-radius: 0;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <>      
      <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
          handleEndCall();
        }
      }}>
        <DialogContent className="sm:max-w-full md:max-w-full p-0 overflow-hidden mobile-call-dialog">
          <div className={`flex flex-col h-full min-h-[100vh] ${getCallBackground()}`}>
            {isIncomingCall && !isOngoingCall && (
              <div className="flex flex-col h-full items-center justify-between p-4">
                <div className="flex flex-col items-center mt-12 space-y-4">
                  <div className="w-32 h-32 relative">
                    <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                      <img 
                        src={remoteUser?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&color=fff`} 
                        alt={displayName} 
                        className="w-full h-full object-cover"
                      />
                    </Avatar>
                    <div className="absolute inset-0 pulse-ring opacity-70"></div>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">{displayName}</h2>
                  <p className="text-gray-600">
                    {currentCallData?.callType === 'video' ? 'Video call from Messenger' : 'Audio call from Messenger'}
                  </p>
                </div>
                
                <div className="flex justify-center space-x-8 mb-12">
                  <button 
                    className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                    onClick={handleRejectCall}
                  >
                    <X className="w-8 h-8 text-white" />
                    <span className="sr-only">Decline</span>
                  </button>
                  <button 
                    className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center shadow-lg hover:bg-green-600 transition-colors"
                    onClick={handleAcceptCall}
                  >
                    <Phone className="w-8 h-8 text-white" />
                    <span className="sr-only">Answer</span>
                  </button>
                </div>
              </div>
            )}
            
            {isOutgoingCall && !isOngoingCall && (
              <div className="flex flex-col h-full items-center justify-between p-4">
                <div className="flex items-center justify-between w-full pt-4">
                  <Button variant="ghost" className="text-gray-800" onClick={handleEndCall}>
                    <ArrowLeft className="w-6 h-6" />
                  </Button>
                </div>
                
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-32 h-32 relative">
                    <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                      <img 
                        src={remoteUser?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&color=fff`} 
                        alt={displayName} 
                        className="w-full h-full object-cover"
                      />
                    </Avatar>
                    <div className="absolute inset-0 pulse-ring opacity-70"></div>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">{displayName}</h2>
                  <p className="text-gray-600">Calling...</p>
                </div>
                
                <div className="flex justify-center space-x-3 mb-8 p-3">
                  {isVideoCall && (
                    <button 
                      className={cn("w-14 h-14 rounded-full flex items-center justify-center shadow-lg", 
                        isVideoOff ? "bg-red-500" : "bg-blue-500 hover:bg-blue-600")}
                      onClick={toggleVideo}
                    >
                      {isVideoOff ? 
                        <VideoOff className="w-6 h-6 text-white" /> : 
                        <Video className="w-6 h-6 text-white" />
                      }
                    </button>
                  )}
                  <button 
                    className={cn("w-14 h-14 rounded-full flex items-center justify-center shadow-lg", 
                      isMuted ? "bg-red-500" : "bg-blue-500 hover:bg-blue-600")}
                    onClick={toggleMute}
                  >
                    {isMuted ? 
                      <MicOff className="w-6 h-6 text-white" /> : 
                      <Mic className="w-6 h-6 text-white" />
                    }
                  </button>
                  <button 
                    className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                    onClick={handleEndCall}
                  >
                    <PhoneOff className="w-6 h-6 text-white" />
                  </button>
                </div>
              </div>
            )}
            
            {isOngoingCall && isVideoCall && (
              <div className="relative flex flex-col h-full">
                <div className="absolute inset-0 bg-black">
                  {remoteStream && (
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                
                {localStream && isVideoCall && (
                  <div className="absolute top-4 right-4 w-1/3 h-1/4 max-w-[120px] max-h-[160px] rounded-lg overflow-hidden border-2 border-white shadow-lg z-10">
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
                  <Button variant="ghost" className="text-white bg-black/30 backdrop-blur-sm rounded-full" onClick={handleEndCall}>
                    <ArrowLeft className="w-6 h-6" />
                  </Button>
                </div>
                
                <div className="absolute bottom-8 left-0 right-0 flex justify-center space-x-4">
                  <button 
                    className={cn("w-14 h-14 rounded-full flex items-center justify-center shadow-lg", 
                      isVideoOff ? "bg-red-500" : "bg-blue-500")}
                    onClick={toggleVideo}
                  >
                    {isVideoOff ? 
                      <VideoOff className="w-6 h-6 text-white" /> : 
                      <Video className="w-6 h-6 text-white" />
                    }
                  </button>
                  <button 
                    className={cn("w-14 h-14 rounded-full flex items-center justify-center shadow-lg", 
                      isMuted ? "bg-red-500" : "bg-blue-500")}
                    onClick={toggleMute}
                  >
                    {isMuted ? 
                      <MicOff className="w-6 h-6 text-white" /> : 
                      <Mic className="w-6 h-6 text-white" />
                    }
                  </button>
                  <button 
                    className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center shadow-lg"
                    onClick={handleEndCall}
                  >
                    <PhoneOff className="w-6 h-6 text-white" />
                  </button>
                </div>
              </div>
            )}
            
            {isOngoingCall && !isVideoCall && (
              <div className="flex flex-col h-full items-center justify-between p-4">
                <div className="flex items-center justify-between w-full pt-4">
                  <Button variant="ghost" className="text-gray-800" onClick={handleEndCall}>
                    <ArrowLeft className="w-6 h-6" />
                  </Button>
                </div>
                
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                      <img 
                        src={remoteUser?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&color=fff`} 
                        alt={displayName} 
                        className="w-full h-full object-cover"
                      />
                    </Avatar>
                    <div className="absolute inset-0 pulse-ring"></div>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">{displayName}</h2>
                  <p className="text-gray-600">
                    {isOngoingCall ? 'Ongoing call' : 'Connecting...'}
                  </p>
                </div>
                
                <div className="flex justify-center space-x-4 mb-8">
                  <button 
                    className={cn("w-14 h-14 rounded-full flex items-center justify-center shadow-lg", 
                      isMuted ? "bg-red-500" : "bg-blue-500 hover:bg-blue-600")}
                    onClick={toggleMute}
                  >
                    {isMuted ? 
                      <MicOff className="w-6 h-6 text-white" /> : 
                      <Mic className="w-6 h-6 text-white" />
                    }
                  </button>
                  <button 
                    className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                    onClick={handleEndCall}
                  >
                    <PhoneOff className="w-6 h-6 text-white" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CallDialog;
