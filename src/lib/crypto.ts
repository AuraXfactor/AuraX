// Simple E2EE helpers using Web Crypto. Keys should be device-wrapped and not sent to backend.

export async function importAesKey(rawKeyBytes: Uint8Array): Promise<CryptoKey> {
  // Use a fresh Uint8Array view as BufferSource (avoids SharedArrayBuffer typing)
  const rawCopy = new Uint8Array(rawKeyBytes);
  return crypto.subtle.importKey(
    'raw',
    rawCopy,
    { name: 'AES-GCM' },
    true,
    ['encrypt', 'decrypt']
  );
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
  return { iv: Array.from(iv), c: toBase64(new Uint8Array(ciphertext)) };
}

export async function decryptJson<T = unknown>(key: CryptoKey, payload: { iv: number[]; c: string }): Promise<T> {
  const iv = new Uint8Array(payload.iv);
  const ct = fromBase64(payload.c);
  // Ensure ArrayBuffer (not SharedArrayBuffer) for BufferSource typing
  const ctBuf = new ArrayBuffer(ct.byteLength);
  new Uint8Array(ctBuf).set(ct);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ctBuf);
  return JSON.parse(new TextDecoder().decode(pt)) as T;
}

const b64chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

function toBase64(bytes: Uint8Array): string {
  let output = '';
  let i = 0;
  while (i < bytes.length) {
    const chr1 = bytes[i++];
    const chr2 = i < bytes.length ? bytes[i++] : NaN;
    const chr3 = i < bytes.length ? bytes[i++] : NaN;

    const enc1 = chr1 >> 2;
    const enc2 = ((chr1 & 3) << 4) | (isNaN(chr2) ? 0 : chr2 >> 4);
    const enc3 = isNaN(chr2) ? 64 : (((chr2 & 15) << 2) | (isNaN(chr3) ? 0 : chr3 >> 6));
    const enc4 = isNaN(chr3) ? 64 : (chr3 & 63);

    output +=
      b64chars.charAt(enc1) +
      b64chars.charAt(enc2) +
      b64chars.charAt(enc3) +
      b64chars.charAt(enc4);
  }
  return output;
}

function fromBase64(b64: string): Uint8Array {
  // Remove any padding or whitespace
  b64 = b64.replace(/[^A-Za-z0-9+/=]/g, '');
  const output: number[] = [];
  let i = 0;
  while (i < b64.length) {
    const enc1 = b64chars.indexOf(b64.charAt(i++));
    const enc2 = b64chars.indexOf(b64.charAt(i++));
    const enc3 = b64chars.indexOf(b64.charAt(i++));
    const enc4 = b64chars.indexOf(b64.charAt(i++));

    const chr1 = (enc1 << 2) | (enc2 >> 4);
    const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    const chr3 = ((enc3 & 3) << 6) | enc4;

    output.push(chr1);
    if (enc3 !== 64) output.push(chr2);
    if (enc4 !== 64) output.push(chr3);
  }
  return new Uint8Array(output);
}

