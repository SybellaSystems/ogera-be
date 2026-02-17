import axios from 'axios';
import { CustomError } from './custom-error';
import { StatusCodes } from 'http-status-codes';

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

/**
 * Verify reCAPTCHA v2 token with Google
 * @param token - The token received from client
 * @returns Verification result
 */
export const verifyCaptcha = async (token: string): Promise<boolean> => {
    try {
        // If RECAPTCHA_SECRET_KEY is not set, skip verification in development
        if (!RECAPTCHA_SECRET_KEY) {
            console.warn('⚠️ RECAPTCHA_SECRET_KEY not found in environment. Skipping CAPTCHA verification.');
            return true; // Allow login without actual verification
        }

        if (!token) {
            throw new CustomError(
                'CAPTCHA token is missing',
                StatusCodes.BAD_REQUEST
            );
        }

        const response = await axios.post(RECAPTCHA_VERIFY_URL, null, {
            params: {
                secret: RECAPTCHA_SECRET_KEY,
                response: token,
            },
        });

        const { success, score, challenge_ts, hostname, error_codes } = response.data;

        // Log verification result for debugging
        console.log('🔐 [CAPTCHA] Verification result:', {
            success,
            score,
            challenge_ts,
            hostname,
            error_codes,
        });

        if (!success) {
            console.warn('⚠️ [CAPTCHA] Verification failed:', error_codes);
            throw new CustomError(
                'CAPTCHA verification failed. Please try again.',
                StatusCodes.BAD_REQUEST
            );
        }

        // For reCAPTCHA v2 Checkbox, score is 1.0 for successful verification
        // For invisible reCAPTCHA, score ranges from 0.0 to 1.0
        // You can adjust this threshold based on your needs
        if (score !== undefined && score < 0.5) {
            console.warn(`⚠️ [CAPTCHA] Low score detected: ${score}`);
            throw new CustomError(
                'CAPTCHA verification score too low. Please try again.',
                StatusCodes.BAD_REQUEST
            );
        }

        return true;
    } catch (error: any) {
        if (error instanceof CustomError) {
            throw error;
        }
        console.error('❌ [CAPTCHA] Verification error:', error.message);
        throw new CustomError(
            'CAPTCHA verification failed. Please try again.',
            StatusCodes.BAD_REQUEST
        );
    }
};
