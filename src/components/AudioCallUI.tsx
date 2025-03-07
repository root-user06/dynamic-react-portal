
import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { User } from '@/lib/types';
import { motion } from 'framer-motion';
import Peer, { MediaConnection } from 'peerjs';
import { toast } from '@/hooks/use-toast';

interface AudioCallUIProps {
  peer: Peer | null;
  call: MediaConnection | null;
  remoteUser: User;
  onEndCall: () => void;
  outgoing?: boolean;
}

const AudioCallUI = ({ peer, call, remoteUser, onEndCall, outgoing = false }: AudioCallUIProps) => {
  const [isMuted, setIsMuted] = useState(false);
  const [callTime, setCallTime] = useState(0);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
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
  
  // Set up local stream
  useEffect(() => {
    const setupStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        
        setLocalStream(stream);
        
        // If there's an active call, attach the stream
        if (call) {
          call.on('stream', (remoteStream) => {
            if (remoteAudioRef.current) {
              remoteAudioRef.current.srcObject = remoteStream;
            }
          });
        }
      } catch (error) {
        console.error("Error accessing microphone:", error);
        toast({
          title: "Microphone access error",
          description: "Unable to access your microphone",
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
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex flex-col items-center justify-center">
      <audio ref={remoteAudioRef} autoPlay />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4"
      >
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-[#46C8B6]/20 flex items-center justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-[#46C8B6] flex items-center justify-center text-white text-2xl pulse-ring">
              {remoteUser.name[0].toUpperCase()}
            </div>
          </div>
          
          <h2 className="text-xl font-semibold text-gray-900">{remoteUser.name}</h2>
          <p className="text-gray-500 mt-1">{outgoing ? "Calling..." : "In call"}</p>
          <p className="text-gray-400 mt-2">{formatTime(callTime)}</p>
        </div>
        
        <div className="flex justify-center gap-4 mt-8">
          <Button
            variant="ghost"
            size="icon"
            className={`rounded-full p-3 ${isMuted ? 'bg-gray-200' : 'bg-gray-100'}`}
            onClick={toggleMute}
          >
            {isMuted ? (
              <MicOff className="h-6 w-6 text-gray-600" />
            ) : (
              <Mic className="h-6 w-6 text-gray-600" />
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
        </div>
      </motion.div>
    </div>
  );
};

export default AudioCallUI;
