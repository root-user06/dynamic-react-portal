
import { database } from './firebase';
import { ref, set, onValue, update, get, push, onChildAdded } from 'firebase/database';
import { CallData } from './callStore';
import { User } from './types';
import notificationService, { soundManager } from './notifications';

class WebRTCService {
  peer: any = null;
  localStream: MediaStream | null = null;
  remoteStream: MediaStream | null = null;
  currentCall: any = null;
  currentUser: User | null = null;
  peerConnection: RTCPeerConnection | null = null;
  dataChannel: RTCDataChannel | null = null;
  
  onIncomingCallCallback: ((callData: CallData) => void) | null = null;
  onCallAcceptedCallback: ((stream: MediaStream) => void) | null = null;
  onCallEndedCallback: (() => void) | null = null;
  
  iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ];

  constructor() {
    // Pre-load any required resources
  }

  async initialize(user: User): Promise<void> {
    this.currentUser = user;
    console.log('WebRTC service initialized for user:', user.id);
    
    try {
      // Set up realtime subscription for call events in Firebase
      const callsRef = ref(database, 'calls');
      
      // Listen for new calls where this user is the receiver
      onChildAdded(callsRef, (snapshot) => {
        const callData = snapshot.val();
        if (callData && callData.receiverId === user.id && callData.status === 'pending') {
          console.log('New call received via Firebase:', callData);
          this.handleIncomingCall({
            callId: callData.callId,
            callerId: callData.callerId,
            callerName: callData.callerName,
            receiverId: callData.receiverId,
            callType: callData.callType,
            timestamp: callData.timestamp,
            status: callData.status
          });
        }
      });
      
      // Listen for changes on current call if any
      this.subscribeToCallUpdates();
      
      console.log('Subscribed to call events for user:', user.id);
    } catch (error) {
      console.error('Error initializing WebRTC service:', error);
      throw error;
    }
  }
  
  private subscribeToCallUpdates(): void {
    if (!this.currentCall) return;
    
    const callRef = ref(database, `calls/${this.currentCall.callId}`);
    onValue(callRef, (snapshot) => {
      const callData = snapshot.val();
      if (!callData) return;
      
      if (callData.status === 'accepted' && this.currentCall.status === 'pending') {
        this.handleCallAccepted(callData);
      } else if (callData.status === 'rejected' || callData.status === 'ended') {
        this.handleCallEnded();
      }
    });
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
      
      // Create peer connection
      this.setupPeerConnection();
      
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
      
      // Save call to Firebase
      const callRef = ref(database, `calls/${callId}`);
      await set(callRef, callData);
      
      // Play outgoing call sound
      soundManager.playSound('outgoing-call', true);
      
      // Store the current call
      this.currentCall = callData;
      
      // Send a call notification
      await notificationService.sendCallNotification(
        this.currentUser.id,
        receiver.id,
        callType,
        callId
      );
      
      // Subscribe to updates on this call
      this.subscribeToCallUpdates();
      
      return callId;
    } catch (error) {
      console.error('Error starting call:', error);
      throw error;
    }
  }
  
  private setupPeerConnection(): void {
    try {
      // Create RTCPeerConnection
      this.peerConnection = new RTCPeerConnection({
        iceServers: this.iceServers
      });
      
      // Add tracks from local stream to peer connection
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          this.peerConnection?.addTrack(track, this.localStream!);
        });
      }
      
      // Set up remote stream
      this.remoteStream = new MediaStream();
      
      // Listen for remote tracks
      this.peerConnection.ontrack = (event) => {
        event.streams[0].getTracks().forEach(track => {
          this.remoteStream?.addTrack(track);
        });
        
        if (this.onCallAcceptedCallback && this.remoteStream) {
          this.onCallAcceptedCallback(this.remoteStream);
        }
      };
      
      // Handle ICE candidates
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate && this.currentCall) {
          // Store the ICE candidate in Firebase
          const candidateRef = push(ref(database, `calls/${this.currentCall.callId}/candidates/${this.currentUser?.id}`));
          set(candidateRef, event.candidate.toJSON());
        }
      };
      
      console.log('Peer connection set up successfully');
    } catch (error) {
      console.error('Error setting up peer connection:', error);
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
      // Stop incoming call sound
      soundManager.stopSound('incoming-call');
      
      // Set up peer connection
      this.setupPeerConnection();
      
      // Get local media based on call type
      const callType = this.currentCall.callType;
      const constraints = {
        audio: true,
        video: callType === 'video'
      };
      
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Update call status in Firebase
      const callRef = ref(database, `calls/${this.currentCall.callId}`);
      await update(callRef, { status: 'accepted' });
      
      // Subscribe to ICE candidates from the caller
      this.listenForRemoteCandidates();
      
      // Create answer
      if (this.peerConnection) {
        // Add tracks to peer connection
        this.localStream.getTracks().forEach(track => {
          this.peerConnection?.addTrack(track, this.localStream!);
        });
        
        // Create and set local description (answer)
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        
        // Store the answer in Firebase
        await update(ref(database, `calls/${this.currentCall.callId}`), {
          answer: {
            type: answer.type,
            sdp: answer.sdp
          }
        });
        
        console.log('Call accepted and answer created');
      }
    } catch (error) {
      console.error('Error accepting call:', error);
      throw error;
    }
  }
  
  private listenForRemoteCandidates(): void {
    if (!this.currentCall || !this.currentUser) return;
    
    const remotePeerId = this.currentCall.callerId === this.currentUser.id 
      ? this.currentCall.receiverId 
      : this.currentCall.callerId;
    
    const candidatesRef = ref(database, `calls/${this.currentCall.callId}/candidates/${remotePeerId}`);
    
    onChildAdded(candidatesRef, async (snapshot) => {
      if (this.peerConnection && this.peerConnection.remoteDescription) {
        const candidate = new RTCIceCandidate(snapshot.val());
        try {
          await this.peerConnection.addIceCandidate(candidate);
          console.log('Added remote ICE candidate');
        } catch (error) {
          console.error('Error adding received ICE candidate:', error);
        }
      }
    });
  }

  async rejectCall(): Promise<void> {
    console.log('Rejecting call');
    
    if (!this.currentCall) {
      console.error('No incoming call to reject');
      return;
    }
    
    try {
      // Stop incoming call sound
      soundManager.stopSound('incoming-call');
      
      // Update call status in Firebase
      const callRef = ref(database, `calls/${this.currentCall.callId}`);
      await update(callRef, { status: 'rejected' });
      
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
      // Stop any playing sounds
      soundManager.stopAllSounds();
      
      // Update call status in Firebase
      const callRef = ref(database, `calls/${this.currentCall.callId}`);
      await update(callRef, { status: 'ended' });
      
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
    this.currentCall = callData;
    
    // Trigger the incoming call callback
    if (this.onIncomingCallCallback) {
      this.onIncomingCallCallback(callData);
    }
  }

  private async handleCallAccepted(callData: any): Promise<void> {
    console.log('Call accepted, setting up connection');
    
    // Stop outgoing call sound
    soundManager.stopSound('outgoing-call');
    
    try {
      if (this.peerConnection && callData.answer) {
        // Set remote description from the answer
        const remoteDesc = new RTCSessionDescription({
          type: callData.answer.type,
          sdp: callData.answer.sdp
        });
        
        await this.peerConnection.setRemoteDescription(remoteDesc);
        console.log('Set remote description from answer');
        
        // Listen for ICE candidates
        this.listenForRemoteCandidates();
      }
    } catch (error) {
      console.error('Error handling accepted call:', error);
    }
  }

  private handleCallEnded(): void {
    console.log('Call ended');
    
    // Stop any playing sounds
    soundManager.stopAllSounds();
    
    // Trigger the call ended callback
    if (this.onCallEndedCallback) {
      this.onCallEndedCallback();
    }
    
    // Clean up resources
    this.cleanup();
  }

  cleanup(): void {
    console.log('Cleaning up WebRTC resources');
    
    // Stop any playing sounds
    soundManager.stopAllSounds();
    
    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    
    // Stop local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        track.stop();
      });
      this.localStream = null;
    }
    
    // Clear remote stream
    this.remoteStream = null;
    
    // Clear current call data
    this.currentCall = null;
  }
}

// Create and export a singleton instance
const webRTCService = new WebRTCService();
export default webRTCService;
