import logger from './logger';

export interface SMSOptions {
    to: string;
    message: string;
}

export interface SMSProvider {
    sendSMS(options: SMSOptions): Promise<void>;
}

/**
 * Twilio SMS Provider
 */
class TwilioSMSProvider implements SMSProvider {
    private accountSid: string;
    private authToken: string;
    private fromNumber: string;
    private client: any;

    constructor(accountSid: string, authToken: string, fromNumber: string) {
        this.accountSid = accountSid;
        this.authToken = authToken;
        this.fromNumber = fromNumber;

        // Dynamically import twilio only if credentials are provided
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const twilio = require('twilio');
            this.client = twilio(accountSid, authToken);
        } catch (error) {
            logger.warn('Twilio package not found. Install with: npm install twilio');
            this.client = null;
        }
    }

    async sendSMS(options: SMSOptions): Promise<void> {
        if (!this.client) {
            throw new Error(
                'Twilio client not initialized. Please install twilio package (npm install twilio) and provide valid credentials.',
            );
        }

        try {
            // Normalize phone number (remove spaces, ensure + prefix)
            const normalizedPhone = options.to.replace(/\s+/g, '').replace(/^\+?/, '+');
            
            const message = await this.client.messages.create({
                body: options.message,
                to: normalizedPhone,
                from: this.fromNumber,
            });

            logger.info('SMS sent successfully via Twilio', {
                to: normalizedPhone,
                messageSid: message.sid,
            });
        } catch (error: any) {
            logger.error('Failed to send SMS via Twilio', {
                to: options.to,
                error: error.message,
                code: error.code,
            });
            throw error;
        }
    }
}

/**
 * Console SMS Provider (for development/testing)
 * Logs SMS to console instead of sending
 */
class ConsoleSMSProvider implements SMSProvider {
    async sendSMS(options: SMSOptions): Promise<void> {
        logger.info('SMS (Console Mode)', {
            to: options.to,
            message: options.message,
        });
        console.log('='.repeat(60));
        console.log('📱 SMS MESSAGE (Console Mode - Not Actually Sent)');
        console.log('To:', options.to);
        console.log('Message:', options.message);
        console.log('='.repeat(60));
    }
}

// SMS Provider Factory
let smsProvider: SMSProvider | null = null;

/**
 * Initialize SMS provider based on configuration
 */
export const initializeSMSProvider = (
    provider: 'twilio' | 'console' | 'none',
    config?: {
        accountSid?: string;
        authToken?: string;
        fromNumber?: string;
    },
): void => {
    if (provider === 'twilio' && config) {
        const { accountSid, authToken, fromNumber } = config;
        if (accountSid && authToken && fromNumber) {
            smsProvider = new TwilioSMSProvider(accountSid, authToken, fromNumber);
            logger.info('SMS Provider initialized: Twilio');
        } else {
            logger.warn(
                'Twilio SMS provider selected but credentials missing. Falling back to console mode.',
            );
            smsProvider = new ConsoleSMSProvider();
        }
    } else if (provider === 'console') {
        smsProvider = new ConsoleSMSProvider();
        logger.info('SMS Provider initialized: Console (Development Mode)');
    } else {
        smsProvider = null;
        logger.info('SMS Provider: Disabled');
    }
};

/**
 * Send SMS
 * @param options SMS options
 * @returns Promise
 */
export const sendSMS = async (options: SMSOptions): Promise<void> => {
    if (!smsProvider) {
        logger.warn(
            'SMS provider not initialized. SMS not sent. To enable SMS, configure SMS_PROVIDER and credentials in .env',
        );
        throw new Error('SMS provider not configured');
    }

    // Normalize phone number (remove spaces, ensure + prefix)
    const normalizedPhone = options.to.replace(/\s+/g, '').replace(/^\+?/, '+');
    
    // Validate phone number format (E.164 format: + followed by 1-15 digits)
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(normalizedPhone)) {
        throw new Error(
            `Invalid phone number format. Phone number must be in E.164 format (e.g., +1234567890). Received: ${options.to}`,
        );
    }

    await smsProvider.sendSMS({
        ...options,
        to: normalizedPhone,
    });
};

/**
 * Send OTP via SMS
 * @param phoneNumber Phone number to send OTP to
 * @param otp OTP code
 * @returns Promise
 */
export const sendOTPSMS = async (
    phoneNumber: string,
    otp: string,
): Promise<void> => {
    const message = `Your Ogera verification code is: ${otp}. This code will expire in 10 minutes. Do not share this code with anyone.`;
    await sendSMS({
        to: phoneNumber,
        message,
    });
};

