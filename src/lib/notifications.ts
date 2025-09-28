// Push Notifications System for AuraX
// Supports: Web Push API, Service Worker notifications, Firebase FCM

import { User } from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp, 
  updateDoc 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type NotificationType = 'message' | 'group_message' | 'comment' | 'friend_request' | 'mention' | 'reaction';

export interface NotificationPayload {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: {
    chatId?: string;
    postId?: string;
    senderId?: string;
    url?: string;
  };
  timestamp: Date;
}

export interface NotificationSettings {
  enabled: boolean;
  messages: boolean;
  groupMessages: boolean;
  comments: boolean;
  friendRequests: boolean;
  mentions: boolean;
  reactions: boolean;
  muteUntil?: Date;
  quietHours?: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string;   // HH:mm format
  };
}

class NotificationManager {
  private static instance: NotificationManager;
  private swRegistration: ServiceWorkerRegistration | null = null;
  private vapidKey = process.env.NEXT_PUBLIC_VAPID_KEY || '';
  
  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  // Initialize service worker and request permissions
  async initialize(): Promise<boolean> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.log('Service workers not supported');
      return false;
    }

    try {
      // Register service worker
      this.swRegistration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service worker registered successfully');

      // Request notification permission
      const permission = await this.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('❌ Service worker registration failed:', error);
      return false;
    }
  }

  // Request notification permission
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission;
    }

    return Notification.permission;
  }

  // Subscribe to push notifications
  async subscribeToPush(user: User): Promise<PushSubscription | null> {
    if (!this.swRegistration || !this.vapidKey) {
      console.error('Service worker not registered or VAPID key missing');
      return null;
    }

    try {
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidKey),
      });

      // Save subscription to Firestore
      await this.saveSubscription(user, subscription);
      console.log('✅ Push subscription saved');

      return subscription;
    } catch (error) {
      console.error('❌ Push subscription failed:', error);
      return null;
    }
  }

  // Save push subscription to Firestore
  private async saveSubscription(user: User, subscription: PushSubscription): Promise<void> {
    const subscriptionData = {
      endpoint: subscription.endpoint,
      keys: {
        auth: subscription.getKey ? btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth') || new ArrayBuffer(0)))) : '',
        p256dh: subscription.getKey ? btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh') || new ArrayBuffer(0)))) : '',
      },
      userId: user.uid,
      createdAt: serverTimestamp(),
      lastUsed: serverTimestamp(),
      userAgent: navigator.userAgent,
      isActive: true,
    };

    const subscriptionRef = doc(db, 'pushSubscriptions', user.uid);
    await setDoc(subscriptionRef, subscriptionData, { merge: true });
  }

  // Show local notification
  async showNotification(payload: NotificationPayload): Promise<void> {
    if (!this.swRegistration || Notification.permission !== 'granted') {
      return;
    }

    const options: NotificationOptions = {
      body: payload.body,
      icon: payload.icon || '/favicon.ico',
      badge: payload.badge || '/favicon.ico',
      tag: payload.id,
      data: payload.data,
    };

    await this.swRegistration.showNotification(payload.title, options);
  }

  // Get notification settings for user
  async getNotificationSettings(userId: string): Promise<NotificationSettings> {
    try {
      const settingsRef = doc(db, 'notificationSettings', userId);
      const settingsDoc = await getDoc(settingsRef);
      
      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        return {
          enabled: data.enabled ?? true,
          messages: data.messages ?? true,
          groupMessages: data.groupMessages ?? true,
          comments: data.comments ?? true,
          friendRequests: data.friendRequests ?? true,
          mentions: data.mentions ?? true,
          reactions: data.reactions ?? false,
          muteUntil: data.muteUntil?.toDate(),
          quietHours: data.quietHours || {
            enabled: false,
            start: '22:00',
            end: '08:00',
          },
        };
      }
      
      // Return default settings
      return {
        enabled: true,
        messages: true,
        groupMessages: true,
        comments: true,
        friendRequests: true,
        mentions: true,
        reactions: false,
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '08:00',
        },
      };
    } catch (error) {
      console.error('Error getting notification settings:', error);
      return {
        enabled: false,
        messages: false,
        groupMessages: false,
        comments: false,
        friendRequests: false,
        mentions: false,
        reactions: false,
      };
    }
  }

  // Update notification settings
  async updateNotificationSettings(userId: string, settings: Partial<NotificationSettings>): Promise<void> {
    try {
      const settingsRef = doc(db, 'notificationSettings', userId);
      await updateDoc(settingsRef, {
        ...settings,
        updatedAt: serverTimestamp(),
      });
      console.log('✅ Notification settings updated');
    } catch (error) {
      console.error('❌ Error updating notification settings:', error);
      throw error;
    }
  }

  // Check if notifications should be sent (considering quiet hours, mute, etc.)
  shouldSendNotification(settings: NotificationSettings, type: NotificationType): boolean {
    if (!settings.enabled) return false;

    // Check if muted
    if (settings.muteUntil && new Date() < settings.muteUntil) {
      return false;
    }

    // Check quiet hours
    if (settings.quietHours?.enabled) {
      const now = new Date();
      const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
      const start = settings.quietHours.start;
      const end = settings.quietHours.end;
      
      if (this.isTimeInRange(currentTime, start, end)) {
        return false;
      }
    }

    // Check specific notification type settings
    switch (type) {
      case 'message':
        return settings.messages;
      case 'group_message':
        return settings.groupMessages;
      case 'comment':
        return settings.comments;
      case 'friend_request':
        return settings.friendRequests;
      case 'mention':
        return settings.mentions;
      case 'reaction':
        return settings.reactions;
      default:
        return true;
    }
  }

  // Helper to check if current time is in quiet hours range
  private isTimeInRange(current: string, start: string, end: string): boolean {
    const currentMinutes = this.timeToMinutes(current);
    const startMinutes = this.timeToMinutes(start);
    const endMinutes = this.timeToMinutes(end);

    if (startMinutes <= endMinutes) {
      // Same day range (e.g., 10:00 to 18:00)
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    } else {
      // Overnight range (e.g., 22:00 to 08:00)
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Create notification payload for different types
  createNotificationPayload(
    type: NotificationType,
    data: {
      senderName: string;
      content?: string;
      chatId?: string;
      postId?: string;
      senderId?: string;
    }
  ): NotificationPayload {
    const id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    switch (type) {
      case 'message':
        return {
          id,
          type,
          title: `New message from ${data.senderName}`,
          body: data.content || 'Sent you a message',
          icon: '/favicon.ico',
          data: {
            chatId: data.chatId,
            senderId: data.senderId,
            url: `/messages?chat=${data.chatId}`,
          },
          timestamp: new Date(),
        };

      case 'group_message':
        return {
          id,
          type,
          title: `${data.senderName} in group chat`,
          body: data.content || 'Sent a message',
          icon: '/favicon.ico',
          data: {
            chatId: data.chatId,
            senderId: data.senderId,
            url: `/messages?chat=${data.chatId}`,
          },
          timestamp: new Date(),
        };

      case 'comment':
        return {
          id,
          type,
          title: `${data.senderName} commented`,
          body: data.content || 'Commented on your post',
          icon: '/favicon.ico',
          data: {
            postId: data.postId,
            senderId: data.senderId,
            url: `/social?post=${data.postId}`,
          },
          timestamp: new Date(),
        };

      case 'friend_request':
        return {
          id,
          type,
          title: 'New friend request',
          body: `${data.senderName} sent you a friend request`,
          icon: '/favicon.ico',
          data: {
            senderId: data.senderId,
            url: '/friends',
          },
          timestamp: new Date(),
        };

      case 'mention':
        return {
          id,
          type,
          title: `${data.senderName} mentioned you`,
          body: data.content || 'You were mentioned in a message',
          icon: '/favicon.ico',
          data: {
            chatId: data.chatId,
            postId: data.postId,
            senderId: data.senderId,
            url: data.chatId ? `/messages?chat=${data.chatId}` : `/social?post=${data.postId}`,
          },
          timestamp: new Date(),
        };

      case 'reaction':
        return {
          id,
          type,
          title: `${data.senderName} reacted`,
          body: data.content || 'Reacted to your message',
          icon: '/favicon.ico',
          data: {
            chatId: data.chatId,
            postId: data.postId,
            senderId: data.senderId,
            url: data.chatId ? `/messages?chat=${data.chatId}` : `/social?post=${data.postId}`,
          },
          timestamp: new Date(),
        };

      default:
        return {
          id,
          type,
          title: 'AuraX Notification',
          body: 'You have a new notification',
          icon: '/favicon.ico',
          timestamp: new Date(),
        };
    }
  }

  // Convert VAPID key
  private urlBase64ToUint8Array(base64String: string): ArrayBuffer {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray.buffer;
  }
}

// Singleton instance
export const notificationManager = NotificationManager.getInstance();

// Helper functions for easy access
export const initializeNotifications = () => notificationManager.initialize();
export const subscribeToPushNotifications = (user: User) => notificationManager.subscribeToPush(user);
export const showNotification = (payload: NotificationPayload) => notificationManager.showNotification(payload);
export const getNotificationSettings = (userId: string) => notificationManager.getNotificationSettings(userId);
export const updateNotificationSettings = (userId: string, settings: Partial<NotificationSettings>) => 
  notificationManager.updateNotificationSettings(userId, settings);
export const shouldSendNotification = (settings: NotificationSettings, type: NotificationType) => 
  notificationManager.shouldSendNotification(settings, type);
export const createNotificationPayload = (
  type: NotificationType,
  data: {
    senderName: string;
    content?: string;
    chatId?: string;
    postId?: string;
    senderId?: string;
  }
) => notificationManager.createNotificationPayload(type, data);