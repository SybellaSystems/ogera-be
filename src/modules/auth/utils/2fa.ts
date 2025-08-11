import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import pool from '../../../config/db.js';

// Generate a new 2FA secret and QR code
export const generate2FASecret = async (userId: string, email: string) => {
    const secret = speakeasy.generateSecret({
        name: `Ogera: ${email}`,
    });
  
    if (!secret.otpauth_url) {
        throw new Error("Failed to generate otpauth URL for 2FA");
    }
  
    await pool.query(
        `UPDATE users SET two_fa_secret = $1 WHERE user_id = $2`,
        [secret.base32, userId]
    );
  
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
  
    return { secret: secret.base32, qrCodeUrl };
};
  

// Verify OTP against stored secret
export const verifyOTP = async (userId: string, token: string) => {
  // Fetch user's 2FA secret from DB
    const { rows } = await pool.query(
        `SELECT two_fa_secret FROM users WHERE user_id = $1`,
        [userId]
    );
    const secret = rows[0].two_fa_secret;

  // Validate token
    const isValid = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: 1, // Allow 1-step time drift
    });

    return isValid;
};

// Enable 2FA for the user after successful verification
export const enable2FA = async (userId: string) => {
    await pool.query(
        `UPDATE users SET 2fa_enabled = TRUE WHERE user_id = $1`,
        [userId]
    );
};