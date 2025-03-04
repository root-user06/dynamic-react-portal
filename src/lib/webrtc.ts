
import { supabase } from '@/integrations/supabase/client';
import { CallData } from './callStore';
import { User } from './types';

class WebRTCService {
  peer: any = null;
  localStream: MediaStream | null = null;
  currentCall: any = null;
  currentUser: User | null = null;
  onIncomingCallCallback: ((callData: CallData) => void) | null = null;
  onCallAcceptedCallback: ((stream: MediaStream) => void) | null = null;
  onCallEndedCallback: (() => void) | null = null;
  sounds: {[key: string]: HTMLAudioElement} = {};

  constructor() {
    // Pre-load sounds
    this.loadSounds();
  }

  loadSounds() {
    // Load sound files
    try {
      const incomingCallSound = new Audio('/sounds/incomming-call.mp3');
      const outgoingCallSound = new Audio('/sounds/Ringing.mp3');
      
      // Cache the audio elements
      this.sounds['incoming-call'] = incomingCallSound;
      this.sounds['outgoing-call'] = outgoingCallSound;
      
      // Preload the audio files
      incomingCallSound.load();
      outgoingCallSound.load();
      
      console.log('Call sounds loaded successfully');
    } catch (error) {
      console.error('Error loading sounds:', error);
    }
  }

  getSound(name: string): HTMLAudioElement | null {
    return this.sounds[name] || null;
  }

  async initialize(user: User): Promise<void> {
    this.currentUser = user;
    console.log('WebRTC service initialized for user:', user.id);
    
    try {
      // Set up realtime subscription for call events
      const channel = supabase
        .channel('call-events')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'calls',
            filter: `receiver_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('New call received via Supabase:', payload);
            const callData = payload.new as any;
            
            // Only handle new pending calls for this user
            if (callData.status === 'pending' && callData.receiver_id === user.id) {
              this.handleIncomingCall({
                callId: callData.call_id,
                callerId: callData.caller_id,
                callerName: callData.caller_name,
                receiverId: callData.receiver_id,
                callType: callData.call_type,
                timestamp: callData.timestamp,
                status: callData.status
              });
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'calls',
          },
          (payload) => {
            console.log('Call status updated:', payload);
            const callData = payload.new as any;
            
            // Handle call status changes
            if (this.currentCall && this.currentCall.callId === callData.call_id) {
              if (callData.status === 'accepted') {
                this.handleCallAccepted();
              } else if (callData.status === 'rejected' || callData.status === 'ended') {
                this.handleCallEnded();
              }
            }
          }
        )
        .subscribe();
      
      console.log('Subscribed to call events for user:', user.id);
    } catch (error) {
      console.error('Error initializing WebRTC service:', error);
      throw error;
    }
  }

  async startCall(receiver: User, callType: 'audio' | 'video'): Promise<string> {
    console.log(`Starting ${callType} call to user:`, receiver.id);
    
    if (!this.currentUser) {
      throw new Error('WebRTC service not initialized with current user');
    }
    
    try {
      // Set up local media stream
      const constraints = {
        audio: true,
        video: callType === 'video'
      };
      
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Generate a unique call ID
      const callId = `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Store call data
      const callData: CallData = {
        callId,
        callerId: this.currentUser.id,
        callerName: this.currentUser.name,
        receiverId: receiver.id,
        callType,
        timestamp: new Date().toISOString(),
        status: 'pending'
      };
      
      // Save call to Supabase
      const { error } = await supabase.from('calls').insert({
        call_id: callId,
        caller_id: this.currentUser.id,
        caller_name: this.currentUser.name,
        receiver_id: receiver.id,
        call_type: callType,
        status: 'pending'
      });
      
      if (error) {
        console.error('Error saving call to Supabase:', error);
        throw error;
      }
      
      // Store the current call
      this.currentCall = {
        callId,
        peer: receiver.id,
        metadata: callData
      };
      
      return callId;
    } catch (error) {
      console.error('Error starting call:', error);
      throw error;
    }
  }

  async acceptCall(): Promise<void> {
    console.log('Accepting call');
    
    if (!this.currentCall) {
      console.error('No incoming call to accept');
      return;
    }
    
    try {
      // Update call status in Supabase
      const { error } = await supabase
        .from('calls')
        .update({ status: 'accepted' })
        .eq('call_id', this.currentCall.callId);
      
      if (error) {
        console.error('Error accepting call:', error);
        throw error;
      }
      
      // Set up local media stream based on call type
      const callType = this.currentCall.metadata.callType;
      const constraints = {
        audio: true,
        video: callType === 'video'
      };
      
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // In a real implementation, you would set up WebRTC peer connection here
      // For the demo, we'll simulate a remote stream
      const remoteStream = new MediaStream();
      
      // Add tracks from local stream to simulate remote stream
      // In a real implementation, these would come from the remote peer
      this.localStream.getTracks().forEach(track => {
        remoteStream.addTrack(track.clone());
      });
      
      // Trigger the call accepted callback with the remote stream
      if (this.onCallAcceptedCallback) {
        this.onCallAcceptedCallback(remoteStream);
      }
    } catch (error) {
      console.error('Error accepting call:', error);
      throw error;
    }
  }

  async rejectCall(): Promise<void> {
    console.log('Rejecting call');
    
    if (!this.currentCall) {
      console.error('No incoming call to reject');
      return;
    }
    
    try {
      // Update call status in Supabase
      const { error } = await supabase
        .from('calls')
        .update({ status: 'rejected' })
        .eq('call_id', this.currentCall.callId);
      
      if (error) {
        console.error('Error rejecting call:', error);
        throw error;
      }
      
      // Trigger the call ended callback
      if (this.onCallEndedCallback) {
        this.onCallEndedCallback();
      }
      
      // Clean up resources
      this.cleanup();
    } catch (error) {
      console.error('Error rejecting call:', error);
      throw error;
    }
  }

  async endCall(): Promise<void> {
    console.log('Ending call');
    
    if (!this.currentCall) {
      console.error('No ongoing call to end');
      return;
    }
    
    try {
      // Update call status in Supabase
      const { error } = await supabase
        .from('calls')
        .update({ status: 'ended' })
        .eq('call_id', this.currentCall.callId);
      
      if (error) {
        console.error('Error ending call:', error);
        throw error;
      }
      
      // Trigger the call ended callback
      if (this.onCallEndedCallback) {
        this.onCallEndedCallback();
      }
      
      // Clean up resources
      this.cleanup();
    } catch (error) {
      console.error('Error ending call:', error);
      throw error;
    }
  }

  onIncomingCall(callback: (callData: CallData) => void): void {
    this.onIncomingCallCallback = callback;
  }

  onCallAccepted(callback: (stream: MediaStream) => void): void {
    this.onCallAcceptedCallback = callback;
  }

  onCallEnded(callback: () => void): void {
    this.onCallEndedCallback = callback;
  }

  private handleIncomingCall(callData: CallData): void {
    console.log('Handling incoming call:', callData);
    
    // Store the current call
    this.currentCall = {
      callId: callData.callId,
      peer: callData.callerId,
      metadata: callData
    };
    
    // Trigger the incoming call callback
    if (this.onIncomingCallCallback) {
      this.onIncomingCallCallback(callData);
    }
  }

  private handleCallAccepted(): void {
    console.log('Call accepted');
    
    if (!this.currentCall) {
      console.error('No current call found');
      return;
    }
    
    // In a real implementation, you would set up WebRTC peer connection here
    // For the demo, we'll simulate a remote stream
    if (this.localStream) {
      const remoteStream = new MediaStream();
      
      // Add tracks from local stream to simulate remote stream
      // In a real implementation, these would come from the remote peer
      this.localStream.getTracks().forEach(track => {
        remoteStream.addTrack(track.clone());
      });
      
      // Trigger the call accepted callback with the remote stream
      if (this.onCallAcceptedCallback) {
        this.onCallAcceptedCallback(remoteStream);
      }
    }
  }

  private handleCallEnded(): void {
    console.log('Call ended');
    
    // Trigger the call ended callback
    if (this.onCallEndedCallback) {
      this.onCallEndedCallback();
    }
    
    // Clean up resources
    this.cleanup();
  }

  cleanup(): void {
    console.log('Cleaning up WebRTC resources');
    
    // Stop local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        track.stop();
      });
      this.localStream = null;
    }
    
    // Clear current call data
    this.currentCall = null;
  }
}

// Create and export a singleton instance
const webRTCService = new WebRTCService();
export default webRTCService;
export type { CallData };
