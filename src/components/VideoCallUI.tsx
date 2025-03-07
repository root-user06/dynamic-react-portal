
import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Phone, Video, VideoOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { User } from '@/lib/types';
import { motion } from 'framer-motion';
import Peer, { MediaConnection } from 'peerjs';
import { toast } from '@/hooks/use-toast';

interface VideoCallUIProps {
  peer: Peer | null;
  call: MediaConnection | null;
  remoteUser: User;
  onEndCall: () => void;
  outgoing?: boolean;
}

const VideoCallUI = ({ peer, call, remoteUser, onEndCall, outgoing = false }: VideoCallUIProps) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callTime, setCallTime] = useState(0);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Set up timer for call duration
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCallTime(prev => prev + 1);
    }, 1000);
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);
  
  // Format time as mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Handle mute toggle
  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
      toast({
        title: isMuted ? "Microphone unmuted" : "Microphone muted",
        duration: 2000
      });
    }
  };
  
  // Handle video toggle
  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = isVideoOff;
      });
      setIsVideoOff(!isVideoOff);
      toast({
        title: isVideoOff ? "Camera turned on" : "Camera turned off",
        duration: 2000
      });
    }
  };
  
  // Set up local stream
  useEffect(() => {
    const setupStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        
        setLocalStream(stream);
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        // If there's an active call, attach the stream
        if (call) {
          call.on('stream', (remoteStream) => {
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = remoteStream;
            }
          });
        }
      } catch (error) {
        console.error("Error accessing camera/microphone:", error);
        toast({
          title: "Camera/Microphone access error",
          description: "Unable to access your camera or microphone",
          variant: "destructive"
        });
        onEndCall();
      }
    };
    
    setupStream();
    
    // Clean up function
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [call]);
  
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Remote video (full screen) */}
      <div className="flex-1 w-full bg-black relative">
        <video 
          ref={remoteVideoRef} 
          autoPlay 
          className={`w-full h-full object-cover ${outgoing ? 'hidden' : ''}`}
        />
        
        {outgoing && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white text-xl">Calling {remoteUser.name}...</div>
          </div>
        )}
        
        {/* Call timer */}
        <div className="absolute top-4 left-0 right-0 text-center">
          <div className="inline-block bg-black/50 text-white px-3 py-1 rounded-full text-sm">
            {formatTime(callTime)}
          </div>
        </div>
        
        {/* Local video (picture-in-picture) */}
        <div className="absolute bottom-24 right-4 w-1/3 max-w-[180px] rounded-lg overflow-hidden border-2 border-white">
          <video 
            ref={localVideoRef} 
            autoPlay 
            muted 
            className="w-full h-full object-cover"
          />
          
          {isVideoOff && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-[#46C8B6] flex items-center justify-center text-white">
                {remoteUser.name[0].toUpperCase()}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Controls */}
      <div className="bg-black p-4 flex justify-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className={`rounded-full p-3 ${isMuted ? 'bg-gray-700' : 'bg-gray-600'}`}
          onClick={toggleMute}
        >
          {isMuted ? (
            <MicOff className="h-6 w-6 text-white" />
          ) : (
            <Mic className="h-6 w-6 text-white" />
          )}
        </Button>
        
        <Button
          variant="destructive"
          size="icon"
          className="rounded-full p-3 h-14 w-14"
          onClick={onEndCall}
        >
          <Phone className="h-6 w-6 transform rotate-135" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className={`rounded-full p-3 ${isVideoOff ? 'bg-gray-700' : 'bg-gray-600'}`}
          onClick={toggleVideo}
        >
          {isVideoOff ? (
            <VideoOff className="h-6 w-6 text-white" />
          ) : (
            <Video className="h-6 w-6 text-white" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default VideoCallUI;
