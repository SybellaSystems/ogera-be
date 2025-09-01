import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { DB } from '@/database';
import { Messages } from '@/utils/messages';
import { TWO_FA } from '@/constant';

// Generate a new 2FA secret and QR code
export const generate2FASecret = async (userId: string, email: string) => {
    const secret = speakeasy.generateSecret({
        name: `${TWO_FA.APP_NAME}: ${email}`,
    });

    if (!secret.otpauth_url) throw new Error(Messages.User.TWO_FA_FAILED);

    await DB.Users.update(
        { two_fa_secret: secret.base32 },
        { where: { user_id: userId } },
    );

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    return { secret: secret.base32, qrCodeUrl };
};

// Verify OTP
export const verifyOTP = async (userId: string, token: string) => {
    const userInstance = await DB.Users.findOne({ where: { user_id: userId } });
    if (!userInstance) throw new Error(Messages.User.USER_NOT_FOUND);

    const user = userInstance.get({ plain: true });
    if (!user.two_fa_secret) throw new Error(Messages.User.TWO_FA_NOT_FOUND);

    return speakeasy.totp.verify({
        secret: user.two_fa_secret,
        encoding: 'base32',
        token,
        window: TWO_FA.WINDOW,
    });
};

// Enable 2FA flag in DB
export const enable2FA = async (userId: string) => {
    await DB.Users.update(
        { two_fa_enabled: true },
        { where: { user_id: userId } },
    );
};
