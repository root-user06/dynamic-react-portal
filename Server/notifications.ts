
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { initializeApp } from 'firebase/app';
import { User } from '@/lib/types';
import { database } from '@/lib/firebase';
import { ref, set, get } from 'firebase/database';

// Re-use the same Firebase config from firebase.ts
 const firebaseConfig = {
     apiKey: "AIzaSyCcWUwbXc6r1M14CNfeojVDo7SyFylvrY8",
     authDomain: "website-database-b5b62.firebaseapp.com",
     databaseURL: "https://website-database-b5b62-default-rtdb.firebaseio.com",
     projectId: "website-database-b5b62",
     storageBucket: "website-database-b5b62.appspot.com",
     messagingSenderId: "799535806005",
     appId: "1:799535806005:web:63752dcd35f62feb55a37c",
     measurementId: "G-4F1W5ZS53S"
   };

class NotificationService {
  private messaging: any = null;
  private token: string | null = null;
  private onMessageCallback: ((payload: any) => void) | null = null;

  constructor() {
    // Initialize Firebase Messaging when in browser environment
    if (typeof window !== 'undefined') {
      try {
        const app = initializeApp(firebaseConfig, 'messaging');
        if ('Notification' in window) {
          this.messaging = getMessaging(app);
          this.setupOnMessage();
        }
      } catch (error) {
        console.error('Error initializing Firebase Messaging:', error);
      }
    }
  }

  // Request permission and get FCM token
  async requestPermission(currentUser: User): Promise<string | null> {
    if (!this.messaging) return null;

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        console.warn('Notification permission not granted');
        return null;
      }

      // Get FCM token
      this.token = await getToken(this.messaging, {
        vapidKey: 'YOUR_VAPID_KEY' // Replace with your actual VAPID key if you have one
      });

      if (this.token) {
        console.log('FCM Token:', this.token);
        
        // Save token to user's profile in Firebase
        await this.saveTokenToDatabase(currentUser.id, this.token);
        
        return this.token;
      } else {
        console.warn('No FCM token available');
        return null;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return null;
    }
  }

  // Save FCM token to Firebase
  private async saveTokenToDatabase(userId: string, token: string): Promise<void> {
    const tokenRef = ref(database, `users/${userId}/fcmTokens/${token}`);
    await set(tokenRef, true);
  }

  // Set up onMessage handler for foreground messages
  private setupOnMessage(): void {
    if (!this.messaging) return;

    onMessage(this.messaging, (payload) => {
      console.log('Message received in foreground:', payload);
      
      // If we have a callback registered, call it
      if (this.onMessageCallback) {
        this.onMessageCallback(payload);
      }

      // If we have notification payload, show it
      if (payload.notification) {
        const { title, body } = payload.notification;
        this.showNotification(title, body);
      }
    });
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

  // Register callback for messages
  onMessage(callback: (payload: any) => void): void {
    this.onMessageCallback = callback;
  }

  // Send a notification to a user
  async sendCallNotification(
    senderId: string, 
    receiverId: string, 
    callType: 'audio' | 'video',
    callId: string
  ): Promise<void> {
    try {
      // Get receiver's FCM tokens
      const tokensRef = ref(database, `users/${receiverId}/fcmTokens`);
      const snapshot = await get(tokensRef);
      
      if (!snapshot.exists()) {
        console.warn('No FCM tokens found for receiver:', receiverId);
        return;
      }

      // Get sender's info
      const senderRef = ref(database, `users/${senderId}`);
      const senderSnapshot = await get(senderRef);
      
      if (!senderSnapshot.exists()) {
        console.warn('Sender not found:', senderId);
        return;
      }

      const sender = senderSnapshot.val() as User;

      // Server-side code would be here in a real app
      // Since we're client-side only, we'll just simulate a notification
      // In a real app, you'd send this to your server which would use Firebase Admin SDK
      
      // Show a local notification instead
      const title = `Incoming ${callType} call`;
      const body = `${sender.name} is calling you`;
      
      this.showNotification(title, body);
      
      console.log('Call notification sent to:', receiverId);
    } catch (error) {
      console.error('Error sending call notification:', error);
    }
  }
}

// Create and export a singleton instance
const notificationService = new NotificationService();
export default notificationService;
