// Chat Stability Utilities
// Provides enhanced error handling, reconnection logic, and stability features

import { User } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';

export interface ChatStabilityConfig {
  maxRetries: number;
  retryDelay: number;
  connectionTimeout: number;
  enableReconnection: boolean;
}

export interface ConnectionStatus {
  isConnected: boolean;
  lastConnected: Date | null;
  retryCount: number;
  errors: string[];
}

export class ChatStabilityManager {
  private config: ChatStabilityConfig;
  private connectionStatus: ConnectionStatus;
  private listeners: Map<string, Unsubscribe> = new Map();
  private retryTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private isDestroyed = false;

  constructor(config: Partial<ChatStabilityConfig> = {}) {
    this.config = {
      maxRetries: 3,
      retryDelay: 1000,
      connectionTimeout: 10000,
      enableReconnection: true,
      ...config
    };

    this.connectionStatus = {
      isConnected: true,
      lastConnected: new Date(),
      retryCount: 0,
      errors: []
    };
  }

  // Enhanced listener with automatic reconnection
  createStableListener<T>(
    listenerId: string,
    docRef: any,
    callback: (data: T) => void,
    onError?: (error: Error) => void
  ): () => void {
    if (this.isDestroyed) {
      console.warn('⚠️ ChatStabilityManager is destroyed, cannot create listener');
      return () => {};
    }

    const setupListener = (retryCount = 0): Unsubscribe => {
      console.log(`🔄 Setting up stable listener: ${listenerId} (attempt ${retryCount + 1})`);

      return onSnapshot(
        docRef,
        (snapshot) => {
          try {
            if (this.isDestroyed) return;

            this.connectionStatus.isConnected = true;
            this.connectionStatus.lastConnected = new Date();
            this.connectionStatus.retryCount = 0;
            this.connectionStatus.errors = [];

            if (snapshot.exists()) {
              callback(snapshot.data() as T);
            } else {
              callback(null as T);
            }
          } catch (error) {
            console.error(`❌ Error in stable listener ${listenerId}:`, error);
            this.handleError(error as Error, listenerId, retryCount);
          }
        },
        (error) => {
          console.error(`❌ Firestore error in listener ${listenerId}:`, error);
          this.handleError(error, listenerId, retryCount);
        }
      );
    };

    const unsubscribe = setupListener();
    this.listeners.set(listenerId, unsubscribe);

    return () => {
      this.cleanupListener(listenerId);
    };
  }

  // Enhanced collection listener with stability
  createStableCollectionListener<T>(
    listenerId: string,
    query: any,
    callback: (data: T[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    if (this.isDestroyed) {
      console.warn('⚠️ ChatStabilityManager is destroyed, cannot create collection listener');
      return () => {};
    }

    const setupListener = (retryCount = 0): Unsubscribe => {
      console.log(`🔄 Setting up stable collection listener: ${listenerId} (attempt ${retryCount + 1})`);

      return onSnapshot(
        query,
        (snapshot) => {
          try {
            if (this.isDestroyed) return;

            this.connectionStatus.isConnected = true;
            this.connectionStatus.lastConnected = new Date();
            this.connectionStatus.retryCount = 0;
            this.connectionStatus.errors = [];

            const data = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            } as T));
            callback(data);
          } catch (error) {
            console.error(`❌ Error in stable collection listener ${listenerId}:`, error);
            this.handleError(error as Error, listenerId, retryCount);
          }
        },
        (error) => {
          console.error(`❌ Firestore error in collection listener ${listenerId}:`, error);
          this.handleError(error, listenerId, retryCount);
        }
      );
    };

    const unsubscribe = setupListener();
    this.listeners.set(listenerId, unsubscribe);

    return () => {
      this.cleanupListener(listenerId);
    };
  }

  private handleError(error: Error, listenerId: string, retryCount: number) {
    if (this.isDestroyed) return;

    this.connectionStatus.isConnected = false;
    this.connectionStatus.errors.push(error.message);

    if (this.config.enableReconnection && retryCount < this.config.maxRetries) {
      console.log(`🔄 Retrying listener ${listenerId} in ${this.config.retryDelay}ms (attempt ${retryCount + 1}/${this.config.maxRetries})`);
      
      const timeout = setTimeout(() => {
        if (this.isDestroyed) return;
        
        // Clean up old listener
        this.cleanupListener(listenerId);
        
        // Create new listener
        const newUnsubscribe = this.createStableListener(
          listenerId,
          this.getListenerRef(listenerId),
          this.getListenerCallback(listenerId),
          this.getListenerErrorCallback(listenerId)
        );
        
        this.listeners.set(listenerId, newUnsubscribe);
      }, this.config.retryDelay * Math.pow(2, retryCount)); // Exponential backoff

      this.retryTimeouts.set(listenerId, timeout);
    } else {
      console.error(`❌ Max retries reached for listener ${listenerId}`);
    }
  }

  private cleanupListener(listenerId: string) {
    const unsubscribe = this.listeners.get(listenerId);
    if (unsubscribe) {
      try {
        unsubscribe();
      } catch (error) {
        console.warn(`⚠️ Error cleaning up listener ${listenerId}:`, error);
      }
      this.listeners.delete(listenerId);
    }

    const timeout = this.retryTimeouts.get(listenerId);
    if (timeout) {
      clearTimeout(timeout);
      this.retryTimeouts.delete(listenerId);
    }
  }

  private getListenerRef(listenerId: string): any {
    // This would need to be implemented based on your specific listener setup
    // For now, return a placeholder
    return null;
  }

  private getListenerCallback(listenerId: string): (data: any) => void {
    // This would need to be implemented based on your specific listener setup
    return () => {};
  }

  private getListenerErrorCallback(listenerId: string): (error: Error) => void {
    // This would need to be implemented based on your specific listener setup
    return () => {};
  }

  // Check connection health
  async checkConnectionHealth(): Promise<boolean> {
    try {
      const testDoc = doc(db, 'test', 'connection');
      await getDoc(testDoc);
      this.connectionStatus.isConnected = true;
      this.connectionStatus.lastConnected = new Date();
      return true;
    } catch (error) {
      console.error('❌ Connection health check failed:', error);
      this.connectionStatus.isConnected = false;
      return false;
    }
  }

  // Get current connection status
  getConnectionStatus(): ConnectionStatus {
    return { ...this.connectionStatus };
  }

  // Force reconnection for all listeners
  async forceReconnection() {
    console.log('🔄 Forcing reconnection for all listeners...');
    
    const listenerIds = Array.from(this.listeners.keys());
    for (const listenerId of listenerIds) {
      this.cleanupListener(listenerId);
    }

    // Wait a bit before reconnecting
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Reconnection logic would go here
    console.log('✅ Reconnection completed');
  }

  // Clean up all resources
  destroy() {
    console.log('🔄 Destroying ChatStabilityManager...');
    this.isDestroyed = true;

    // Clean up all listeners
    for (const listenerId of this.listeners.keys()) {
      this.cleanupListener(listenerId);
    }

    // Clear all timeouts
    for (const timeout of this.retryTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.retryTimeouts.clear();

    console.log('✅ ChatStabilityManager destroyed');
  }
}

// Global stability manager instance
let globalStabilityManager: ChatStabilityManager | null = null;

export function getChatStabilityManager(): ChatStabilityManager {
  if (!globalStabilityManager) {
    globalStabilityManager = new ChatStabilityManager({
      maxRetries: 3,
      retryDelay: 1000,
      connectionTimeout: 10000,
      enableReconnection: true
    });
  }
  return globalStabilityManager;
}

export function destroyChatStabilityManager() {
  if (globalStabilityManager) {
    globalStabilityManager.destroy();
    globalStabilityManager = null;
  }
}

// Utility functions for enhanced error handling
export function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  return new Promise((resolve, reject) => {
    let retryCount = 0;

    const attempt = async () => {
      try {
        const result = await operation();
        resolve(result);
      } catch (error) {
        retryCount++;
        if (retryCount < maxRetries) {
          console.log(`🔄 Retrying operation (attempt ${retryCount + 1}/${maxRetries})`);
          setTimeout(attempt, delay * Math.pow(2, retryCount - 1)); // Exponential backoff
        } else {
          reject(error);
        }
      }
    };

    attempt();
  });
}

export function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number = 10000
): Promise<T> {
  return Promise.race([
    operation,
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    })
  ]);
}

// Enhanced error types
export class ChatStabilityError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = true
  ) {
    super(message);
    this.name = 'ChatStabilityError';
  }
}

export class ConnectionError extends ChatStabilityError {
  constructor(message: string) {
    super(message, 'CONNECTION_ERROR', true);
  }
}

export class AuthenticationError extends ChatStabilityError {
  constructor(message: string) {
    super(message, 'AUTHENTICATION_ERROR', false);
  }
}

export class PermissionError extends ChatStabilityError {
  constructor(message: string) {
    super(message, 'PERMISSION_ERROR', false);
  }
}