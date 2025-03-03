
import React from 'react';
import { Phone, Video, PhoneOff, PhoneMissed } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface CallMessageProps {
  callType: 'audio' | 'video';
  callStatus: 'started' | 'ended' | 'missed' | 'outgoing';
  timestamp: string;
  sender: boolean;
  callerName: string;
  onCallBack?: () => void;
}

const CallMessage: React.FC<CallMessageProps> = ({
  callType,
  callStatus,
  timestamp,
  sender,
  callerName,
  onCallBack
}) => {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getCallIcon = () => {
    if (callStatus === 'missed') {
      return <PhoneMissed className="text-red-500" size={16} />;
    } else if (callStatus === 'ended') {
      return callType === 'video' ? 
        <Video className="text-blue-500" size={16} /> : 
        <Phone className="text-green-500" size={16} />;
    } else if (callStatus === 'outgoing') {
      return callType === 'video' ? 
        <Video className="text-blue-500" size={16} /> : 
        <Phone className="text-green-500" size={16} />;
    } else {
      return callType === 'video' ? 
        <Video className="text-blue-500" size={16} /> : 
        <Phone className="text-green-500" size={16} />;
    }
  };

  const getCallMessage = () => {
    if (callStatus === 'missed') {
      return sender ? 
        `Missed ${callType} call` : 
        `${callerName} missed your ${callType} call`;
    } else if (callStatus === 'ended') {
      return `${callType === 'video' ? 'Video' : 'Audio'} call ended`;
    } else if (callStatus === 'outgoing') {
      return `Outgoing ${callType} call`;
    } else {
      return `${callType === 'video' ? 'Video' : 'Audio'} call started`;
    }
  };

  return (
    <div className={cn(
      "flex items-center p-2 rounded-lg my-1 max-w-[70%] text-sm bg-gray-100",
      sender ? "ml-auto" : "mr-auto"
    )}>
      <div className="flex items-center gap-2">
        <div className="bg-white p-1.5 rounded-full">
          {getCallIcon()}
        </div>
        <div>
          <div className="text-sm font-medium">{getCallMessage()}</div>
          <div className="text-xs text-gray-500">{formatTime(timestamp)}</div>
          
          {callStatus === 'missed' && onCallBack && (
            <Button 
              variant="ghost" 
              className="text-xs text-primary px-0 py-0 h-auto" 
              onClick={onCallBack}
            >
              Tap to call back
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CallMessage;
