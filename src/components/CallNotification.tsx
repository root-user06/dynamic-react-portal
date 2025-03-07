
import { useState, useEffect } from 'react';
import { Phone, X, Volume2, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChatStore } from '@/lib/store';
import { User } from '@/lib/types';
import { AnimatePresence, motion } from 'framer-motion';

interface CallNotificationProps {
  caller: User;
  callType: 'audio' | 'video';
  onAccept: () => void;
  onReject: () => void;
}

const CallNotification = ({
  caller,
  callType,
  onAccept,
  onReject
}: CallNotificationProps) => {
  const [ringtone] = useState(new Audio('/ringtone.mp3'));
  
  useEffect(() => {
    console.log("Call notification shown for:", caller.name, "Type:", callType);
    ringtone.loop = true;
    ringtone.play().catch(error => console.error("Error playing ringtone:", error));
    
    return () => {
      ringtone.pause();
      ringtone.currentTime = 0;
    };
  }, [ringtone]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed top-4 right-4 left-4 z-50 max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200"
      >
        <div className="p-4 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-[#46C8B6] flex items-center justify-center text-white pulse-ring">
            {callType === 'audio' ? (
              <Volume2 className="h-6 w-6" />
            ) : (
              <Video className="h-6 w-6" />
            )}
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Incoming {callType} call</h3>
            <p className="text-sm text-gray-600">{caller.name}</p>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={onReject}
              variant="destructive"
              size="icon"
              className="rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
            
            <Button
              onClick={onAccept}
              className="bg-green-500 hover:bg-green-600 rounded-full"
              size="icon"
            >
              <Phone className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CallNotification;
