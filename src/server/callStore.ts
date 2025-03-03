import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/lib/types';
import { CallData } from './webrtc';

export interface CallState {
  // Call status
  isIncomingCall: boolean;
  isOngoingCall: boolean;
  isOutgoingCall: boolean;
  
  // Call metadata
  currentCallData: CallData | null;
  remoteStream: MediaStream | null;
  localStream: MediaStream | null;
  callError: string | null;
  
  // User reference
  remoteUser: User | null;
  
  // Actions
  setIncomingCall: (isIncoming: boolean, callData?: CallData | null) => void;
  setOutgoingCall: (isOutgoing: boolean, callData?: CallData | null) => void;
  setOngoingCall: (isOngoing: boolean, callData?: CallData | null) => void;
  setRemoteStream: (stream: MediaStream | null) => void;
  setLocalStream: (stream: MediaStream | null) => void;
  setRemoteUser: (user: User | null) => void;
  setCallError: (error: string | null) => void;
  resetCallState: () => void;
}

// Initial state object
const initialState = {
  isIncomingCall: false,
  isOngoingCall: false,
  isOutgoingCall: false,
  currentCallData: null,
  remoteStream: null,
  localStream: null,
  callError: null,
  remoteUser: null,
};

export const useCallStore = create<CallState>()(
  persist(
    (set) => ({
      ...initialState,
      
      setIncomingCall: (isIncoming, callData = null) => set((state) => ({
        isIncomingCall: isIncoming,
        isOutgoingCall: isIncoming ? false : state.isOutgoingCall,
        currentCallData: callData || state.currentCallData,
      })),
      
      setOutgoingCall: (isOutgoing, callData = null) => set((state) => ({
        isOutgoingCall: isOutgoing,
        isIncomingCall: isOutgoing ? false : state.isIncomingCall,
        currentCallData: callData || state.currentCallData,
      })),
      
      setOngoingCall: (isOngoing, callData = null) => set((state) => ({
        isOngoingCall: isOngoing,
        // When call becomes ongoing, clear incoming/outgoing flags
        isIncomingCall: isOngoing ? false : state.isIncomingCall,
        isOutgoingCall: isOngoing ? false : state.isOutgoingCall,
        currentCallData: callData || state.currentCallData,
      })),
      
      setRemoteStream: (stream) => set({
        remoteStream: stream,
      }),
      
      setLocalStream: (stream) => set({
        localStream: stream,
      }),
      
      setRemoteUser: (user) => set({
        remoteUser: user,
      }),
      
      setCallError: (error) => set({
        callError: error,
      }),
      
      resetCallState: () => set({
        ...initialState,
      }),
    }),
    {
      name: 'call-store',
      partialize: (state) => ({
        // Only persist these values, everything else resets on page refresh
        // Usually you wouldn't persist any of this since streams can't be serialized
        // But we keep this structure for consistency
      }),
    }
  )
);
