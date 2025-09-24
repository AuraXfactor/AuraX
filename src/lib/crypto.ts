// Simple E2EE helpers using Web Crypto. Keys should be device-wrapped and not sent to backend.

export async function importAesKey(rawKeyBytes: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', rawKeyBytes, 'AES-GCM', true, ['encrypt', 'decrypt']);
}

export async function generateAesKey(): Promise<{ key: CryptoKey; raw: Uint8Array }> {
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  const raw = new Uint8Array(await crypto.subtle.exportKey('raw', key));
  return { key, raw };
}

export async function encryptJson(key: CryptoKey, data: unknown): Promise<{ iv: number[]; c: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(data));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);
  return { iv: Array.from(iv), c: Buffer.from(ciphertext).toString('base64') };
}

export async function decryptJson<T = unknown>(key: CryptoKey, payload: { iv: number[]; c: string }): Promise<T> {
  const iv = new Uint8Array(payload.iv);
  const ct = Uint8Array.from(Buffer.from(payload.c, 'base64'));
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
  return JSON.parse(new TextDecoder().decode(pt)) as T;
}

