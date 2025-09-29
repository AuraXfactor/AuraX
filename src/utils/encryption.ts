// End-to-End Encryption Utilities for AuraX Chat
export class ChatEncryption {
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256;
  
  // Generate a new encryption key for a chat session
  static async generateKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH,
      },
      true, // extractable
      ['encrypt', 'decrypt']
    );
  }
  
  // Export key to be stored/shared
  static async exportKey(key: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey('jwk', key);
    return JSON.stringify(exported);
  }
  
  // Import key from stored/shared format
  static async importKey(keyData: string): Promise<CryptoKey> {
    const keyObject = JSON.parse(keyData);
    return await crypto.subtle.importKey(
      'jwk',
      keyObject,
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH,
      },
      true,
      ['encrypt', 'decrypt']
    );
  }
  
  // Encrypt a message
  static async encrypt(message: string, key: CryptoKey): Promise<{
    encrypted: string;
    iv: string;
  }> {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    
    // Generate a random initialization vector
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encrypted = await crypto.subtle.encrypt(
      {
        name: this.ALGORITHM,
        iv: iv,
      },
      key,
      data
    );
    
    return {
      encrypted: this.arrayBufferToBase64(encrypted),
      iv: this.arrayBufferToBase64(iv.buffer),
    };
  }
  
  // Decrypt a message
  static async decrypt(encryptedData: string, iv: string, key: CryptoKey): Promise<string> {
    const encrypted = this.base64ToArrayBuffer(encryptedData);
    const ivBuffer = this.base64ToArrayBuffer(iv);
    
    const decrypted = await crypto.subtle.decrypt(
      {
        name: this.ALGORITHM,
        iv: ivBuffer,
      },
      key,
      encrypted
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }
  
  // Utility functions
  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
  
  private static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
  
  // Generate a chat ID for two users (deterministic)
  static generateChatId(userId1: string, userId2: string): string {
    const sortedIds = [userId1, userId2].sort();
    return `chat_${sortedIds[0]}_${sortedIds[1]}`;
  }
  
  // Generate a shared key for two users using their UIDs
  static async generateSharedKey(userId1: string, userId2: string): Promise<CryptoKey> {
    const chatId = this.generateChatId(userId1, userId2);
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(chatId),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    
    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('aurax-chat-salt'),
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH,
      },
      true,
      ['encrypt', 'decrypt']
    );
  }
}