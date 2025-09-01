import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { DB } from "@/database";
const User = DB.User;

// Generate a new 2FA secret and QR code
export const generate2FASecret = async (userId: string, email: string) => {
  const secret = speakeasy.generateSecret({
    name: `Ogera: ${email}`,
  });

  if (!secret.otpauth_url) throw new Error("Failed to generate otpauth URL for 2FA");

  // Save secret to DB
  await User.update({ two_fa_secret: secret.base32 }, { where: { user_id: userId } });

  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

  return { secret: secret.base32, qrCodeUrl };
};

// Verify OTP against stored secret
export const verifyOTP = async (userId: string, token: string) => {
  const userInstance = await User.findOne({ where: { user_id: userId } });
  if (!userInstance) throw new Error("User not found");

  const user = userInstance.get({ plain: true });
  if (!user.two_fa_secret) throw new Error("2FA secret not found");

  return speakeasy.totp.verify({
    secret: user.two_fa_secret,
    encoding: "base32",
    token,
    window: 1, // allow small drift
  });
};

// Enable 2FA after successful verification
export const enable2FA = async (userId: string) => {
  await User.update({ two_fa_enabled: true }, { where: { user_id: userId } });
};
