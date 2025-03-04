
import { User } from './types';
import { database } from './firebase';
import { ref, get } from 'firebase/database';

// Sound management class to organize audio functionality
class SoundManager {
  private sounds: {[key: string]: HTMLAudioElement} = {};

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadSounds();
    }
  }

  private loadSounds() {
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

  playSound(name: string, loop: boolean = false): void {
    const sound = this.getSound(name);
    if (sound) {
      sound.loop = loop;
      sound.currentTime = 0;
      sound.play().catch(err => {
        console.warn(`Could not play ${name} sound:`, err);
      });
    }
  }

  stopSound(name: string): void {
    const sound = this.getSound(name);
    if (sound) {
      sound.pause();
      sound.currentTime = 0;
    }
  }

  stopAllSounds(): void {
    Object.values(this.sounds).forEach(sound => {
      sound.pause();
      sound.currentTime = 0;
    });
  }
}

// Create the sound manager instance
const soundManager = new SoundManager();

class NotificationService {
  private onMessageCallback: ((payload: any) => void) | null = null;

  constructor() {
    // Initialize notification-related functionality
    if (typeof window !== 'undefined') {
      this.setupServiceWorker();
    }
  }

  private async setupServiceWorker() {
    try {
      if ('serviceWorker' in navigator && 'Notification' in window) {
        // You could register a service worker for push notifications here
        console.log('Service worker and notifications are supported');
      }
    } catch (error) {
      console.error('Error setting up service worker:', error);
    }
  }

  // Get access to sound functionality
  getSoundManager(): SoundManager {
    return soundManager;
  }

  // Request permission for notifications
  async requestPermission(currentUser: User): Promise<string | null> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return null;
    }

    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        console.log('Notification permission granted');
        return 'granted';
      } else {
        console.warn('Notification permission denied');
        return null;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return null;
    }
  }

  // Register callback for messages
  onMessage(callback: (payload: any) => void): void {
    this.onMessageCallback = callback;
  }

  // Show a browser notification
  private showNotification(title: string, body: string): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: '/Logo.svg'
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  }

  // Send a call notification
  async sendCallNotification(
    senderId: string, 
    receiverId: string, 
    callType: 'audio' | 'video',
    callId: string
  ): Promise<void> {
    try {
      // Get sender's info from Firebase
      const senderRef = ref(database, `users/${senderId}`);
      const senderSnapshot = await get(senderRef);
      
      if (!senderSnapshot.exists()) {
        console.warn('Sender not found:', senderId);
        return;
      }

      const senderData = senderSnapshot.val();
      
      // Show a local notification
      const title = `Incoming ${callType} call`;
      const body = `${senderData.name} is calling you`;
      
      this.showNotification(title, body);
      
      // Play incoming call sound
      soundManager.playSound('incoming-call', true);
      
      console.log('Call notification sent to:', receiverId);
    } catch (error) {
      console.error('Error sending call notification:', error);
    }
  }
}

// Create and export a singleton instance
const notificationService = new NotificationService();
export default notificationService;
export { soundManager };
