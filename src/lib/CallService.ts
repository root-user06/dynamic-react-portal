
import Peer, { MediaConnection } from 'peerjs';
import { User } from './types';

type CallType = 'audio' | 'video';

interface IncomingCall {
  call: MediaConnection;
  caller: User;
  type: CallType;
}

// Singleton service to manage call state across components
class CallService {
  private static instance: CallService;
  private peer: Peer | null = null;
  private peerId: string | null = null;
  private currentCall: MediaConnection | null = null;
  private incomingCallListeners: ((call: IncomingCall) => void)[] = [];
  private callEndedListeners: (() => void)[] = [];
  private callAcceptedListeners: ((call: MediaConnection) => void)[] = [];
  
  private generateId(): string {
    return Math.random().toString(36).substring(2, 10);
  }
  
  private constructor() {}
  
  public static getInstance(): CallService {
    if (!CallService.instance) {
      CallService.instance = new CallService();
    }
    return CallService.instance;
  }
  
  public initialize(): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const id = this.generateId();
        this.peer = new Peer(id);
        
        this.peer.on('open', (id) => {
          this.peerId = id;
          console.log('My peer ID is: ', id);
          resolve(id);
        });
        
        this.peer.on('call', (call) => {
          // Get the caller's info from the metadata
          const metadata = call.metadata || {};
          const caller: User = metadata.user;
          const type: CallType = metadata.type || 'audio';
          
          if (caller && this.incomingCallListeners.length > 0) {
            this.incomingCallListeners.forEach(listener => 
              listener({ call, caller, type })
            );
          }
        });
        
        this.peer.on('error', (err) => {
          console.error('Peer connection error:', err);
          reject(err);
        });
        
        this.peer.on('disconnected', () => {
          console.log('Peer disconnected');
          this.endCurrentCall();
        });
      } catch (err) {
        console.error('Error initializing peer:', err);
        reject(err);
      }
    });
  }
  
  public getPeerId(): string | null {
    return this.peerId;
  }
  
  // Add a public method to get the peer instance
  public getPeer(): Peer | null {
    return this.peer;
  }
  
  public callUser(user: User, remotePeerId: string, type: CallType = 'audio'): Promise<MediaConnection> {
    return new Promise((resolve, reject) => {
      if (!this.peer) {
        reject(new Error('Peer not initialized'));
        return;
      }
      
      // Get user media based on call type
      const mediaConstraints = type === 'audio' 
        ? { audio: { echoCancellation: true, noiseSuppression: true } } 
        : { audio: { echoCancellation: true, noiseSuppression: true }, video: true };
      
      navigator.mediaDevices.getUserMedia(mediaConstraints)
        .then(stream => {
          if (!this.peer) return;
          
          // Include the caller's info in metadata
          const call = this.peer.call(remotePeerId, stream, {
            metadata: {
              user: user,
              type: type
            }
          });
          
          this.currentCall = call;
          resolve(call);
        })
        .catch(err => {
          console.error('Failed to get local stream', err);
          reject(err);
        });
    });
  }
  
  public answerCall(call: MediaConnection, type: CallType = 'audio'): Promise<void> {
    return new Promise((resolve, reject) => {
      const mediaConstraints = type === 'audio' 
        ? { audio: { echoCancellation: true, noiseSuppression: true } } 
        : { audio: { echoCancellation: true, noiseSuppression: true }, video: true };
      
      navigator.mediaDevices.getUserMedia(mediaConstraints)
        .then(stream => {
          call.answer(stream);
          this.currentCall = call;
          this.callAcceptedListeners.forEach(listener => listener(call));
          resolve();
        })
        .catch(err => {
          console.error('Failed to get local stream', err);
          reject(err);
        });
    });
  }
  
  public endCurrentCall(): void {
    if (this.currentCall) {
      this.currentCall.close();
      this.callEndedListeners.forEach(listener => listener());
      this.currentCall = null;
    }
  }
  
  public addIncomingCallListener(listener: (call: IncomingCall) => void): void {
    this.incomingCallListeners.push(listener);
  }
  
  public removeIncomingCallListener(listener: (call: IncomingCall) => void): void {
    this.incomingCallListeners = this.incomingCallListeners.filter(l => l !== listener);
  }
  
  public addCallEndedListener(listener: () => void): void {
    this.callEndedListeners.push(listener);
  }
  
  public removeCallEndedListener(listener: () => void): void {
    this.callEndedListeners = this.callEndedListeners.filter(l => l !== listener);
  }
  
  public addCallAcceptedListener(listener: (call: MediaConnection) => void): void {
    this.callAcceptedListeners.push(listener);
  }
  
  public removeCallAcceptedListener(listener: (call: MediaConnection) => void): void {
    this.callAcceptedListeners = this.callAcceptedListeners.filter(l => l !== listener);
  }
  
  public getCurrentCall(): MediaConnection | null {
    return this.currentCall;
  }
  
  public destroy(): void {
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
      this.peerId = null;
      this.currentCall = null;
    }
  }
}

export default CallService;
