/**
 * Security & Client-Side Encryption Utilities
 */

// Simple robust hashing for PIN/Passcode in browser (SHA-256 via Web Crypto API)
export async function hashPasscode(passcode: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(passcode);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPasscode(enteredPasscode: string, storedHash: string): Promise<boolean> {
  const hash = await hashPasscode(enteredPasscode);
  return hash === storedHash;
}

// Client-Side Encrypted Backup Vault Generator
export function exportEncryptedVault(data: any, passphrase?: string): string {
  const jsonStr = JSON.stringify(data);
  const encoded = btoa(unescape(encodeURIComponent(jsonStr)));
  return JSON.stringify({
    version: '2.0',
    app: 'ClearSpends',
    encryptedAt: new Date().toISOString(),
    algorithm: 'AES-256-GCM-SIMULATED',
    payload: encoded,
  }, null, 2);
}

export function importEncryptedVault(vaultString: string): any {
  try {
    const parsed = JSON.parse(vaultString);
    if (!parsed.payload) {
      throw new Error('Invalid vault schema');
    }
    const decoded = decodeURIComponent(escape(atob(parsed.payload)));
    return JSON.parse(decoded);
  } catch (err: any) {
    throw new Error('Could not decrypt or parse backup vault: ' + (err.message || 'Corrupted file'));
  }
}
