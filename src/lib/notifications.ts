
import { User } from './types';
import { supabase } from '@/integrations/supabase/client';

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
      // Get sender's info from context
      const { data: senderData, error: senderError } = await supabase
        .from('users')
        .select('name')
        .eq('id', senderId)
        .single();
      
      if (senderError || !senderData) {
        console.warn('Sender not found:', senderId);
        return;
      }

      // Show a local notification
      const title = `Incoming ${callType} call`;
      const body = `${senderData.name} is calling you`;
      
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
