
import Peer from 'peerjs';
import { v4 as uuidv4 } from 'uuid';
import { database } from '@/lib/firebase';
import { ref, set, onValue, remove } from 'firebase/database';
import { User } from '@/lib/types';

// Configure STUN servers
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
  call: any | null; // Changed from Peer.MediaConnection to any
}

class WebRTCService {
  private peer: Peer | null = null;
  private myStream: MediaStream | null = null;
  private currentCall: any | null = null; // Changed from Peer.MediaConnection to any
  private currentUser: User | null = null;
  private onIncomingCallCallback: ((callData: CallData) => void) | null = null;
  private onCallAcceptedCallback: ((stream: MediaStream) => void) | null = null;
  private onCallEndedCallback: (() => void) | null = null;

  constructor() {
    // Initialize listeners for call status changes
    this.initCallStatusListeners();
  }

  // Initialize the WebRTC peer connection
  async initialize(currentUser: User): Promise<void> {
    if (this.peer) {
      this.peer.destroy();
    }

    this.currentUser = currentUser;

    return new Promise((resolve, reject) => {
      try {
        // Create a new Peer with the user's ID and STUN/TURN server configuration
        this.peer = new Peer(currentUser.id, {
          config: ICE_SERVERS
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
      try {
        // Get caller information from database
        const callerId = call.metadata?.callerId || call.peer;
        const callRef = ref(database, `calls/${callerId}_${this.currentUser?.id}`);
        
        onValue(callRef, (snapshot) => {
          const callData = snapshot.val() as CallData;
          if (callData && this.onIncomingCallCallback) {
            this.onIncomingCallCallback(callData);
          }
        }, { onlyOnce: true });

        // Store the current call
        this.currentCall = call;
      } catch (error) {
        console.error('Error handling incoming call:', error);
      }
    });
  }

  // Initialize listeners for call status changes in Firebase
  private initCallStatusListeners(): void {
    if (!this.currentUser) return;

    // Listen for call status changes
    const callsRef = ref(database, 'calls');
    onValue(callsRef, (snapshot) => {
      const calls = snapshot.val();
      if (!calls) return;

      Object.entries(calls).forEach(([key, value]) => {
        const callData = value as CallData;
        const [callerId, receiverId] = key.split('_');

        // If I'm the receiver and the call was accepted, missed, or ended
        if (receiverId === this.currentUser?.id && callData.status === 'ended' && this.onCallEndedCallback) {
          this.onCallEndedCallback();
        }
      });
    });
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

  // Start a call to another user
  async startCall(receiver: User, callType: 'audio' | 'video'): Promise<string> {
    if (!this.peer || !this.currentUser) {
      throw new Error('WebRTC not initialized');
    }

    try {
      // Get media stream based on call type
      const constraints = {
        audio: true,
        video: callType === 'video'
      };

      this.myStream = await navigator.mediaDevices.getUserMedia(constraints);

      // Generate a unique call ID
      const callId = uuidv4();

      // Store call data in Firebase
      const callData: CallData = {
        callId,
        callerId: this.currentUser.id,
        callerName: this.currentUser.name,
        receiverId: receiver.id,
        callType,
        timestamp: new Date().toISOString(),
        status: 'pending'
      };

      const callRef = ref(database, `calls/${this.currentUser.id}_${receiver.id}`);
      await set(callRef, callData);

      // Call the peer
      this.currentCall = this.peer.call(receiver.id, this.myStream, {
        metadata: {
          callerId: this.currentUser.id,
          callType
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
      // Get media stream
      const constraints = {
        audio: true,
        video: this.currentCall.metadata?.callType === 'video'
      };

      this.myStream = await navigator.mediaDevices.getUserMedia(constraints);

      // Update call status in Firebase
      const callerId = this.currentCall.metadata?.callerId || this.currentCall.peer;
      const callRef = ref(database, `calls/${callerId}_${this.currentUser.id}`);
      
      // Get current call data and update status
      onValue(callRef, (snapshot) => {
        const callData = snapshot.val() as CallData;
        if (callData) {
          set(callRef, {
            ...callData,
            status: 'accepted'
          });
        }
      }, { onlyOnce: true });

      // Answer the call with our media stream
      this.currentCall.answer(this.myStream);

      // Set up event handlers for the call
      this.setupCallEventHandlers(this.currentCall);

      return new Promise((resolve) => {
        this.currentCall!.on('stream', (remoteStream) => {
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
      const callerId = this.currentCall.metadata?.callerId || this.currentCall.peer;
      const callRef = ref(database, `calls/${callerId}_${this.currentUser.id}`);
      
      // Get current call data and update status
      onValue(callRef, (snapshot) => {
        const callData = snapshot.val() as CallData;
        if (callData) {
          set(callRef, {
            ...callData,
            status: 'rejected'
          });
        }
      }, { onlyOnce: true });

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
      const callerId = this.currentUser.id;
      const receiverId = this.currentCall.peer;
      const callRef = ref(database, `calls/${callerId}_${receiverId}`);
      
      // Check if we need to update receiver's call reference instead
      onValue(callRef, (snapshot) => {
        if (!snapshot.exists()) {
          const alternateCallRef = ref(database, `calls/${receiverId}_${callerId}`);
          
          onValue(alternateCallRef, (snapshot) => {
            const callData = snapshot.val() as CallData;
            if (callData) {
              set(alternateCallRef, {
                ...callData,
                status: 'ended'
              });
            }
          }, { onlyOnce: true });
        } else {
          const callData = snapshot.val() as CallData;
          if (callData) {
            set(callRef, {
              ...callData,
              status: 'ended'
            });
          }
        }
      }, { onlyOnce: true });

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
  private setupCallEventHandlers(call: any): void { // Changed from Peer.MediaConnection to any
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

  // Clean up resources
  cleanup(): void {
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
