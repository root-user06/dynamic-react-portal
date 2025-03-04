
import Peer from 'peerjs';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../src/integrations/supabase/client';
import { User } from './lib/types';

// Configure STUN servers for optimal connection
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ]
};

export interface CallData {
  callId: string;
  callerId: string;
  callerName: string;
  receiverId: string;
  callType: 'audio' | 'video';
  timestamp: string;
  status: 'pending' | 'accepted' | 'rejected' | 'ended' | 'missed';
}

export interface PeerConnection {
  peer: Peer;
  stream: MediaStream | null;
  call: any | null;
}

class WebRTCService {
  private peer: Peer | null = null;
  private myStream: MediaStream | null = null;
  private currentCall: any | null = null;
  private currentUser: User | null = null;
  private onIncomingCallCallback: ((callData: CallData) => void) | null = null;
  private onCallAcceptedCallback: ((stream: MediaStream) => void) | null = null;
  private onCallEndedCallback: (() => void) | null = null;
  private subscribedChannels: string[] = [];
  private soundCache: { [key: string]: HTMLAudioElement } = {};

  constructor() {
    this.preloadSounds();
    this.listenForCallStatusChanges();
  }

  private preloadSounds() {
    // Preload sounds to avoid issues
    const sounds = [
      { name: 'incoming-call', path: '/sounds/incoming-call.mp3' },
      { name: 'outgoing-call', path: '/sounds/outgoing-call.mp3' }
    ];

    sounds.forEach(sound => {
      const audio = new Audio();
      audio.src = sound.path;
      audio.load(); // Preload the audio
      this.soundCache[sound.name] = audio;
    });
  }

  getSound(name: string): HTMLAudioElement | null {
    return this.soundCache[name] || null;
  }

  // Initialize the WebRTC peer connection
  async initialize(currentUser: User): Promise<void> {
    if (this.peer) {
      this.peer.destroy();
    }

    this.currentUser = currentUser;

    return new Promise((resolve, reject) => {
      try {
        console.log('Initializing WebRTC with user ID:', currentUser.id);
        // Create a new Peer with the user's ID and STUN/TURN server configuration
        this.peer = new Peer(currentUser.id, {
          config: ICE_SERVERS,
          debug: 3 // Set debug level to see what's happening
        });

        this.peer.on('open', (id) => {
          console.log('Connected to PeerJS server with ID:', id);
          this.setupCallListeners();
          resolve();
        });

        this.peer.on('error', (error) => {
          console.error('PeerJS error:', error);
          reject(error);
        });

        this.peer.on('disconnected', () => {
          console.log('Disconnected from PeerJS server, attempting to reconnect...');
          this.peer?.reconnect();
        });
      } catch (error) {
        console.error('Error initializing WebRTC:', error);
        reject(error);
      }
    });
  }

  // Set up listeners for incoming calls
  private setupCallListeners(): void {
    if (!this.peer) return;

    this.peer.on('call', async (call) => {
      console.log('Received call from peer:', call.peer);
      try {
        // Store the current call
        this.currentCall = call;
        
        // Get call data from Supabase
        const { data: callData } = await supabase
          .from('calls')
          .select('*')
          .eq('call_id', call.metadata?.callId || '')
          .single();
        
        if (callData && this.onIncomingCallCallback) {
          const formattedCallData: CallData = {
            callId: callData.call_id,
            callerId: callData.caller_id,
            callerName: callData.caller_name,
            receiverId: callData.receiver_id,
            callType: callData.call_type,
            timestamp: callData.timestamp,
            status: callData.status
          };
          
          console.log('Incoming call data:', formattedCallData);
          this.onIncomingCallCallback(formattedCallData);
        } else {
          console.error('Failed to get call data from Supabase');
        }
      } catch (error) {
        console.error('Error handling incoming call:', error);
      }
    });
  }

  // Listen for call status changes in Supabase
  private listenForCallStatusChanges(): void {
    const currentUserId = this.currentUser?.id;
    if (!currentUserId) return;

    // Unsubscribe from any existing channels
    this.subscribedChannels.forEach(channelName => {
      supabase.removeChannel(supabase.channel(channelName));
    });
    this.subscribedChannels = [];

    // Listen for call updates
    const callChannel = supabase.channel('call-updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'calls' },
        (payload) => {
          const callData = payload.new as any;
          
          // Check if this call involves the current user
          if (callData.caller_id === currentUserId || callData.receiver_id === currentUserId) {
            console.log('Call status changed:', callData.status);
            
            // Handle call ended
            if (callData.status === 'ended' && this.onCallEndedCallback) {
              this.onCallEndedCallback();
            }
          }
        }
      )
      .subscribe();
      
    this.subscribedChannels.push('call-updates');
  }

  // Register callbacks
  onIncomingCall(callback: (callData: CallData) => void): void {
    this.onIncomingCallCallback = callback;
  }

  onCallAccepted(callback: (stream: MediaStream) => void): void {
    this.onCallAcceptedCallback = callback;
  }

  onCallEnded(callback: () => void): void {
    this.onCallEndedCallback = callback;
  }

  // Start a call to another user with optimized media settings
  async startCall(receiver: User, callType: 'audio' | 'video'): Promise<string> {
    if (!this.peer || !this.currentUser) {
      throw new Error('WebRTC not initialized');
    }

    try {
      console.log(`Starting ${callType} call to user:`, receiver.id);
      
      // Get media stream based on call type with optimized settings
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: callType === 'video' ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } : false
      };

      this.myStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Got local media stream');

      // Generate a unique call ID
      const callId = uuidv4();

      // Store call data in Supabase
      const callData = {
        call_id: callId,
        caller_id: this.currentUser.id,
        caller_name: this.currentUser.name,
        receiver_id: receiver.id,
        call_type: callType,
        timestamp: new Date().toISOString(),
        status: 'pending'
      };

      const { error } = await supabase.from('calls').insert(callData);
      
      if (error) {
        console.error('Error storing call data:', error);
        throw error;
      }
      
      console.log('Call data stored, calling peer:', receiver.id);

      // Call the peer
      this.currentCall = this.peer.call(receiver.id, this.myStream, {
        metadata: {
          callerId: this.currentUser.id,
          callType,
          callId
        }
      });

      // Set up event handlers for the call
      this.setupCallEventHandlers(this.currentCall);

      return callId;
    } catch (error) {
      console.error('Error starting call:', error);
      throw error;
    }
  }

  // Accept an incoming call
  async acceptCall(): Promise<MediaStream> {
    if (!this.peer || !this.currentCall || !this.currentUser) {
      throw new Error('No incoming call to accept');
    }

    try {
      console.log('Accepting call');
      
      // Get media stream with optimized settings
      const callType = this.currentCall.metadata?.callType || 'audio';
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: callType === 'video' ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } : false
      };

      this.myStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Got local media stream for accepting call');

      // Update call status in Supabase
      const callerId = this.currentCall.metadata?.callerId || this.currentCall.peer;
      const callId = this.currentCall.metadata?.callId;
      
      if (callId) {
        const { error } = await supabase
          .from('calls')
          .update({ status: 'accepted' })
          .eq('call_id', callId);
          
        if (error) {
          console.error('Error updating call status:', error);
        }
      }

      // Answer the call with our media stream
      this.currentCall.answer(this.myStream);
      console.log('Call answered');

      // Set up event handlers for the call
      this.setupCallEventHandlers(this.currentCall);

      return new Promise((resolve) => {
        this.currentCall!.on('stream', (remoteStream) => {
          console.log('Received remote stream');
          if (this.onCallAcceptedCallback) {
            this.onCallAcceptedCallback(remoteStream);
          }
          resolve(remoteStream);
        });
      });
    } catch (error) {
      console.error('Error accepting call:', error);
      throw error;
    }
  }

  // Reject an incoming call
  async rejectCall(): Promise<void> {
    if (!this.currentCall || !this.currentUser) {
      return;
    }

    try {
      console.log('Rejecting call');
      
      const callId = this.currentCall.metadata?.callId;
      
      if (callId) {
        const { error } = await supabase
          .from('calls')
          .update({ status: 'rejected' })
          .eq('call_id', callId);
          
        if (error) {
          console.error('Error updating call status:', error);
        }
      }

      // Close the call
      this.currentCall.close();
      this.currentCall = null;
    } catch (error) {
      console.error('Error rejecting call:', error);
    }
  }

  // End an ongoing call
  async endCall(): Promise<void> {
    if (!this.currentCall || !this.currentUser) {
      return;
    }

    try {
      console.log('Ending call');
      
      const callId = this.currentCall.metadata?.callId;
      
      if (callId) {
        const { error } = await supabase
          .from('calls')
          .update({ status: 'ended' })
          .eq('call_id', callId);
          
        if (error) {
          console.error('Error updating call status:', error);
        }
      }

      // Close the call
      this.currentCall.close();
      this.currentCall = null;

      // Stop all tracks in the media stream
      if (this.myStream) {
        this.myStream.getTracks().forEach(track => track.stop());
        this.myStream = null;
      }

      if (this.onCallEndedCallback) {
        this.onCallEndedCallback();
      }
    } catch (error) {
      console.error('Error ending call:', error);
    }
  }

  // Set up event handlers for a call
  private setupCallEventHandlers(call: any): void {
    call.on('stream', (remoteStream) => {
      console.log('Received remote stream');
      if (this.onCallAcceptedCallback) {
        this.onCallAcceptedCallback(remoteStream);
      }
    });

    call.on('close', () => {
      console.log('Call closed');
      if (this.onCallEndedCallback) {
        this.onCallEndedCallback();
      }
    });

    call.on('error', (err) => {
      console.error('Call error:', err);
      this.endCall().catch(console.error);
    });
  }

  // Get the local stream
  get localStream(): MediaStream | null {
    return this.myStream;
  }

  // Clean up resources
  cleanup(): void {
    console.log('Cleaning up WebRTC resources');
    
    // Unsubscribe from any existing channels
    this.subscribedChannels.forEach(channelName => {
      supabase.removeChannel(supabase.channel(channelName));
    });
    this.subscribedChannels = [];
    
    if (this.currentCall) {
      this.currentCall.close();
      this.currentCall = null;
    }

    if (this.myStream) {
      this.myStream.getTracks().forEach(track => track.stop());
      this.myStream = null;
    }

    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
  }
}

// Create and export a singleton instance
const webRTCService = new WebRTCService();
export default webRTCService;
