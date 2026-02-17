import crypto from 'crypto';

/**
 * Encrypt/decrypt helper for TOTP secrets.
 *
 * Expects `SECRET_KEY` to be a 32-byte key encoded as hex (64 chars).
 * If `SECRET_KEY` is missing/misconfigured, falls back to returning plaintext
 * to avoid breaking auth flows in development.
 *
 * Format: ivHex:tagHex:cipherHex (AES-256-GCM)
 */
const getKey = (): Buffer | null => {
    const keyHex = process.env.SECRET_KEY;
    if (!keyHex) return null;
    try {
        const key = Buffer.from(keyHex, 'hex');
        if (key.length !== 32) return null;
        return key;
    } catch {
        return null;
    }
};

export const encryptSecret = (secret: string): string => {
    const key = getKey();
    if (!key) return secret;

    const iv = crypto.randomBytes(12); // recommended IV length for GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([
        cipher.update(secret, 'utf8'),
        cipher.final(),
    ]);
    const tag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString(
        'hex',
    )}`;
};

export const decryptSecret = (value: string): string => {
    const key = getKey();
    if (!key) return value;

    const parts = value.split(':');
    // Expected new format: iv:tag:cipher
    if (parts.length !== 3) {
        // Legacy / plaintext fallback
        return value;
    }

    const [ivHex, tagHex, cipherHex] = parts;
    try {
        const iv = Buffer.from(ivHex, 'hex');
        const tag = Buffer.from(tagHex, 'hex');
        const cipherText = Buffer.from(cipherHex, 'hex');

        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(tag);
        const decrypted = Buffer.concat([
            decipher.update(cipherText),
            decipher.final(),
        ]);
        return decrypted.toString('utf8');
    } catch {
        // If decrypt fails (bad key/format), treat as plaintext so login doesn't hard-fail.
        return value;
    }
};
