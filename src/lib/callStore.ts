
import { create } from 'zustand';
import { User } from './types';

// Define types for the call store
export interface CallData {
  callId: string;
  callerId: string;
  callerName: string;
  receiverId?: string;
  callType: 'audio' | 'video';
  timestamp: string;
  status: 'pending' | 'accepted' | 'rejected' | 'ended' | 'missed';
}

interface CallState {
  isIncomingCall: boolean;
  isOutgoingCall: boolean;
  isOngoingCall: boolean;
  currentCallData: CallData | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  remoteUser: User | null;
  setIncomingCall: (isIncoming: boolean, callData?: CallData) => void;
  setOutgoingCall: (isOutgoing: boolean, callData?: CallData) => void;
  setOngoingCall: (isOngoing: boolean) => void;
  setLocalStream: (stream: MediaStream | null) => void;
  setRemoteStream: (stream: MediaStream | null) => void;
  setRemoteUser: (user: User | null) => void;
  resetCallState: () => void;
}

export const useCallStore = create<CallState>((set) => ({
  isIncomingCall: false,
  isOutgoingCall: false,
  isOngoingCall: false,
  currentCallData: null,
  localStream: null,
  remoteStream: null,
  remoteUser: null,
  
  setIncomingCall: (isIncoming, callData) => set({
    isIncomingCall: isIncoming,
    currentCallData: isIncoming ? callData || null : null,
  }),
  
  setOutgoingCall: (isOutgoing, callData) => set({
    isOutgoingCall: isOutgoing,
    currentCallData: isOutgoing ? callData || null : null,
  }),
  
  setOngoingCall: (isOngoing) => set({
    isOngoingCall: isOngoing,
    isIncomingCall: isOngoing ? false : false,
    isOutgoingCall: isOngoing ? false : false,
  }),
  
  setLocalStream: (stream) => set({
    localStream: stream,
  }),
  
  setRemoteStream: (stream) => set({
    remoteStream: stream,
  }),
  
  setRemoteUser: (user) => set({
    remoteUser: user,
  }),
  
  resetCallState: () => set({
    isIncomingCall: false,
    isOutgoingCall: false,
    isOngoingCall: false,
    currentCallData: null,
    remoteStream: null,
    remoteUser: null,
  }),
}));
