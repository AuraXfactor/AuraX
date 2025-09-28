// Enhanced End-to-End Encryption Utilities for AuraX Chat
// Supports: Direct Messages, Group Chats, File Encryption

export class ChatEncryption {
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256;
  private static readonly SALT_PREFIX = 'aurax-chat-salt-v2';
  
  // Key storage for session-based encryption
  private static keyCache = new Map<string, CryptoKey>();
  
  // ===== BASIC ENCRYPTION METHODS =====
  
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
  
  // ===== ADVANCED ENCRYPTION FOR DIFFERENT CHAT TYPES =====
  
  // Generate deterministic chat ID for direct messages
  static generateChatId(userId1: string, userId2: string): string {
    const sortedIds = [userId1, userId2].sort();
    return `dm_${sortedIds[0]}_${sortedIds[1]}`;
  }
  
  // Generate group chat ID
  static generateGroupChatId(): string {
    return `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Generate shared key for direct messages using user IDs
  static async generateSharedKey(userId1: string, userId2: string): Promise<CryptoKey> {
    const chatId = this.generateChatId(userId1, userId2);
    const cacheKey = `dm_${chatId}`;
    
    // Check cache first
    if (this.keyCache.has(cacheKey)) {
      return this.keyCache.get(cacheKey)!;
    }
    
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(chatId),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode(`${this.SALT_PREFIX}-${chatId}`),
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
    
    // Cache the key
    this.keyCache.set(cacheKey, key);
    return key;
  }
  
  // Generate shared key for group chats
  static async generateGroupKey(groupId: string, participants: string[]): Promise<CryptoKey> {
    const cacheKey = `group_${groupId}`;
    
    // Check cache first
    if (this.keyCache.has(cacheKey)) {
      return this.keyCache.get(cacheKey)!;
    }
    
    // Create deterministic key material from sorted participants
    const sortedParticipants = [...participants].sort();
    const keySource = `${groupId}_${sortedParticipants.join('_')}`;
    
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(keySource),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode(`${this.SALT_PREFIX}-group-${groupId}`),
        iterations: 150000, // Higher iterations for group chats
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
    
    // Cache the key
    this.keyCache.set(cacheKey, key);
    return key;
  }
  
  // ===== FILE ENCRYPTION =====
  
  // Encrypt file data
  static async encryptFile(file: File, key: CryptoKey): Promise<{
    encryptedData: ArrayBuffer;
    iv: string;
    originalName: string;
    originalType: string;
    originalSize: number;
  }> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const fileData = await file.arrayBuffer();
    
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: this.ALGORITHM,
        iv: iv,
      },
      key,
      fileData
    );
    
    return {
      encryptedData,
      iv: this.arrayBufferToBase64(iv.buffer),
      originalName: file.name,
      originalType: file.type,
      originalSize: file.size,
    };
  }
  
  // Decrypt file data
  static async decryptFile(
    encryptedData: ArrayBuffer,
    iv: string,
    key: CryptoKey,
    originalName: string,
    originalType: string
  ): Promise<File> {
    const ivBuffer = this.base64ToArrayBuffer(iv);
    
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: this.ALGORITHM,
        iv: ivBuffer,
      },
      key,
      encryptedData
    );
    
    return new File([decryptedData], originalName, { type: originalType });
  }
  
  // ===== KEY MANAGEMENT =====
  
  // Clear cached keys (for security)
  static clearKeyCache(): void {
    this.keyCache.clear();
  }
  
  // Remove specific key from cache
  static removeKeyFromCache(chatId: string, isGroup = false): void {
    const cacheKey = isGroup ? `group_${chatId}` : `dm_${chatId}`;
    this.keyCache.delete(cacheKey);
  }
  
  // Generate key fingerprint for verification
  static async generateKeyFingerprint(key: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey('jwk', key);
    const keyString = JSON.stringify(exported);
    const encoder = new TextEncoder();
    const data = encoder.encode(keyString);
    
    const hash = await crypto.subtle.digest('SHA-256', data);
    return this.arrayBufferToBase64(hash).substr(0, 16);
  }
  
  // ===== FORWARD SECRECY =====
  
  // Generate ephemeral key pair for forward secrecy
  static async generateEphemeralKeyPair(): Promise<CryptoKeyPair> {
    return await crypto.subtle.generateKey(
      {
        name: 'ECDH',
        namedCurve: 'P-256',
      },
      true,
      ['deriveKey']
    );
  }
  
  // Derive shared secret from ephemeral keys
  static async deriveSharedSecret(
    privateKey: CryptoKey,
    publicKey: CryptoKey
  ): Promise<CryptoKey> {
    return await crypto.subtle.deriveKey(
      {
        name: 'ECDH',
        public: publicKey,
      },
      privateKey,
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH,
      },
      false,
      ['encrypt', 'decrypt']
    );
  }
  
  // ===== UTILITY FUNCTIONS =====
  
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
  
  // Generate secure random string
  static generateSecureRandom(length = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return this.arrayBufferToBase64(array.buffer)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }
  
  // Validate encryption parameters
  static validateEncryptionParams(data: {
    encrypted: string;
    iv: string;
  }): boolean {
    try {
      this.base64ToArrayBuffer(data.encrypted);
      this.base64ToArrayBuffer(data.iv);
      return true;
    } catch {
      return false;
    }
  }
}