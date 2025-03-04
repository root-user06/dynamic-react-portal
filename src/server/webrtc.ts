
import { v4 as uuidv4 } from 'uuid';
import { database } from '@/lib/firebase';
import { ref, set, onValue, remove } from 'firebase/database';
import { User } from '@/lib/types';
import { io, Socket } from 'socket.io-client';

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

// Configure signaling server
const SIGNALING_SERVER = import.meta.env.VITE_SIGNALING_SERVER || 'http://localhost:3001';

export interface CallData {
  callId: string;
  callerId: string;
  callerName: string;
  receiverId: string;
  callType: 'audio' | 'video';
  timestamp: string;
  status: 'pending' | 'accepted' | 'rejected' | 'ended' | 'missed';
}

class WebRTCService {
  private socket: Socket | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private remoteStreams: Map<string, MediaStream> = new Map();
  private currentUser: User | null = null;
  private currentCall: CallData | null = null;
  
  private onIncomingCallCallback: ((callData: CallData) => void) | null = null;
  private onCallAcceptedCallback: ((stream: MediaStream) => void) | null = null;
  private onCallEndedCallback: (() => void) | null = null;

  constructor() {
    // Initialize Socket.io connection
    this.initSocketConnection();
  }

  // Initialize the Socket.io connection
  private initSocketConnection(): void {
    try {
      this.socket = io(SIGNALING_SERVER, {
        withCredentials: true,
        transports: ['websocket'],
        autoConnect: false
      });

      this.setupSocketListeners();
    } catch (error) {
      console.error('Error initializing Socket.io connection:', error);
    }
  }

  // Set up Socket.io event listeners
  private setupSocketListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to signaling server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    this.socket.on('call:incoming', (callData: CallData) => {
      console.log('Incoming call:', callData);
      this.currentCall = callData;

      if (this.onIncomingCallCallback) {
        this.onIncomingCallCallback(callData);
      }
    });

    this.socket.on('call:accepted', async (data) => {
      console.log('Call accepted:', data);
      await this.createPeerConnection(data.callerId, data.receiverId);
    });

    this.socket.on('call:rejected', (data) => {
      console.log('Call rejected:', data);
      this.closePeerConnection(data.callerId);
      if (this.onCallEndedCallback) {
        this.onCallEndedCallback();
      }
    });

    this.socket.on('call:ended', (data) => {
      console.log('Call ended:', data);
      const peerId = data.callerId === this.currentUser?.id ? data.receiverId : data.callerId;
      this.closePeerConnection(peerId);
      if (this.onCallEndedCallback) {
        this.onCallEndedCallback();
      }
    });

    this.socket.on('sdp-offer', async (data) => {
      console.log('Received SDP offer');
      await this.handleOffer(data.sdp, data.from);
    });

    this.socket.on('sdp-answer', async (data) => {
      console.log('Received SDP answer');
      await this.handleAnswer(data.sdp, data.from);
    });

    this.socket.on('ice-candidate', async (data) => {
      console.log('Received ICE candidate');
      await this.handleIceCandidate(data.candidate, data.from);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from signaling server');
    });
  }

  // Initialize WebRTC for the current user
  async initialize(currentUser: User): Promise<void> {
    this.currentUser = currentUser;

    // Connect to signaling server
    if (this.socket && !this.socket.connected) {
      this.socket.connect();
      
      // Register user once connected
      this.socket.once('connect', () => {
        this.socket?.emit('user:join', currentUser.id);
      });
    }

    // Also update user status in Firebase
    this.updateUserStatus({
      ...currentUser,
      isOnline: true,
      lastSeen: new Date().toISOString()
    });

    return Promise.resolve();
  }

  // Update user status in Firebase
  private async updateUserStatus(user: User): Promise<void> {
    try {
      const userRef = ref(database, `users/${user.id}`);
      await set(userRef, user);
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  }

  // Create RTCPeerConnection
  private async createPeerConnection(localUserId: string, remoteUserId: string): Promise<RTCPeerConnection> {
    const peerId = remoteUserId;
    
    // Check if connection already exists
    if (this.peerConnections.has(peerId)) {
      return this.peerConnections.get(peerId)!;
    }

    // Create new connection
    const peerConnection = new RTCPeerConnection(ICE_SERVERS);
    this.peerConnections.set(peerId, peerConnection);

    // Add local stream tracks to peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, this.localStream!);
      });
    }

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket?.emit('ice-candidate', {
          target: peerId,
          candidate: event.candidate
        });
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', peerConnection.connectionState);
      if (['disconnected', 'failed', 'closed'].includes(peerConnection.connectionState)) {
        this.closePeerConnection(peerId);
      }
    };

    // Handle incoming tracks (remote stream)
    peerConnection.ontrack = (event) => {
      console.log('Received remote track');
      const remoteStream = new MediaStream();
      event.streams[0].getTracks().forEach(track => {
        remoteStream.addTrack(track);
      });
      this.remoteStreams.set(peerId, remoteStream);

      if (this.onCallAcceptedCallback) {
        this.onCallAcceptedCallback(remoteStream);
      }
    };

    return peerConnection;
  }

  // Handle incoming SDP offer
  private async handleOffer(offer: RTCSessionDescriptionInit, from: string): Promise<void> {
    try {
      const peerConnection = await this.createPeerConnection(this.currentUser!.id, from);
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      this.socket?.emit('sdp-answer', {
        target: from,
        sdp: answer
      });
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  }

  // Handle incoming SDP answer
  private async handleAnswer(answer: RTCSessionDescriptionInit, from: string): Promise<void> {
    try {
      const peerConnection = this.peerConnections.get(from);
      if (peerConnection) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      }
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  }

  // Handle incoming ICE candidate
  private async handleIceCandidate(candidate: RTCIceCandidateInit, from: string): Promise<void> {
    try {
      const peerConnection = this.peerConnections.get(from);
      if (peerConnection) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  }

  // Close peer connection
  private closePeerConnection(peerId: string): void {
    const peerConnection = this.peerConnections.get(peerId);
    if (peerConnection) {
      peerConnection.close();
      this.peerConnections.delete(peerId);
    }

    const remoteStream = this.remoteStreams.get(peerId);
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
      this.remoteStreams.delete(peerId);
    }
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
    if (!this.socket || !this.currentUser) {
      throw new Error('WebRTC not initialized');
    }

    try {
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

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);

      // Generate a unique call ID
      const callId = uuidv4();

      // Create call data
      const callData: CallData = {
        callId,
        callerId: this.currentUser.id,
        callerName: this.currentUser.name,
        receiverId: receiver.id,
        callType,
        timestamp: new Date().toISOString(),
        status: 'pending'
      };

      // Store current call
      this.currentCall = callData;

      // Create peer connection
      await this.createPeerConnection(this.currentUser.id, receiver.id);
      const peerConnection = this.peerConnections.get(receiver.id);
      
      if (peerConnection) {
        // Create and send offer
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        
        this.socket.emit('sdp-offer', {
          target: receiver.id,
          sdp: offer
        });
      }

      // Emit call start event
      this.socket.emit('call:start', callData);

      // Store call data in Firebase for backup
      const callRef = ref(database, `calls/${this.currentUser.id}_${receiver.id}`);
      await set(callRef, callData);

      return callId;
    } catch (error) {
      console.error('Error starting call:', error);
      throw error;
    }
  }

  // Accept an incoming call
  async acceptCall(): Promise<MediaStream> {
    if (!this.socket || !this.currentCall || !this.currentUser) {
      throw new Error('No incoming call to accept');
    }

    try {
      // Get media stream with optimized settings
      const callType = this.currentCall.callType;
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

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);

      const callerId = this.currentCall.callerId;
      
      // Update call status
      this.currentCall.status = 'accepted';
      
      // Notify caller
      this.socket.emit('call:accept', this.currentCall);
      
      // Update call data in Firebase
      const callRef = ref(database, `calls/${callerId}_${this.currentUser.id}`);
      await set(callRef, this.currentCall);

      // Wait for remote stream
      return new Promise((resolve) => {
        const checkForStream = () => {
          const remoteStream = this.remoteStreams.get(callerId);
          if (remoteStream) {
            resolve(remoteStream);
          } else {
            setTimeout(checkForStream, 100);
          }
        };
        
        checkForStream();
      });
    } catch (error) {
      console.error('Error accepting call:', error);
      throw error;
    }
  }

  // Reject an incoming call
  async rejectCall(): Promise<void> {
    if (!this.socket || !this.currentCall || !this.currentUser) {
      return;
    }

    try {
      const callerId = this.currentCall.callerId;
      
      // Update call status
      this.currentCall.status = 'rejected';
      
      // Notify caller
      this.socket.emit('call:reject', this.currentCall);
      
      // Update call data in Firebase
      const callRef = ref(database, `calls/${callerId}_${this.currentUser.id}`);
      await set(callRef, this.currentCall);
      
      // Close connections
      this.closePeerConnection(callerId);
      this.currentCall = null;
    } catch (error) {
      console.error('Error rejecting call:', error);
    }
  }

  // End an ongoing call
  async endCall(): Promise<void> {
    if (!this.socket || !this.currentCall || !this.currentUser) {
      return;
    }

    try {
      // Update call status
      this.currentCall.status = 'ended';
      
      // Notify other user
      this.socket.emit('call:end', this.currentCall);
      
      // Update call data in Firebase
      const callerId = this.currentCall.callerId;
      const receiverId = this.currentCall.receiverId;
      const callRef = ref(database, `calls/${callerId}_${receiverId}`);
      await set(callRef, this.currentCall);
      
      // Close connections
      const peerId = callerId === this.currentUser.id ? receiverId : callerId;
      this.closePeerConnection(peerId);
      
      // Stop local stream
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop());
        this.localStream = null;
      }
      
      this.currentCall = null;
      
      if (this.onCallEndedCallback) {
        this.onCallEndedCallback();
      }
    } catch (error) {
      console.error('Error ending call:', error);
    }
  }

  // Clean up resources
  cleanup(): void {
    // Close all peer connections
    this.peerConnections.forEach((connection, peerId) => {
      this.closePeerConnection(peerId);
    });

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Disconnect from signaling server
    if (this.socket) {
      this.socket.disconnect();
    }

    // Update user status in Firebase
    if (this.currentUser) {
      this.updateUserStatus({
        ...this.currentUser,
        isOnline: false,
        lastSeen: new Date().toISOString()
      });
    }
  }
}

// Create and export a singleton instance
const webRTCService = new WebRTCService();
export default webRTCService;
