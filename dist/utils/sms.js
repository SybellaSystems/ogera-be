"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOTPSMS = exports.sendSMS = exports.initializeSMSProvider = void 0;
const logger_1 = __importDefault(require("./logger"));
/**
 * Twilio SMS Provider
 */
class TwilioSMSProvider {
    constructor(accountSid, authToken, fromNumber) {
        this.accountSid = accountSid;
        this.authToken = authToken;
        this.fromNumber = fromNumber;
        // Dynamically import twilio only if credentials are provided
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const twilio = require('twilio');
            this.client = twilio(accountSid, authToken);
        }
        catch (error) {
            logger_1.default.warn('Twilio package not found. Install with: npm install twilio');
            this.client = null;
        }
    }
    sendSMS(options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client) {
                throw new Error('Twilio client not initialized. Please install twilio package (npm install twilio) and provide valid credentials.');
            }
            try {
                // Normalize phone number (remove spaces, ensure + prefix)
                const normalizedPhone = options.to.replace(/\s+/g, '').replace(/^\+?/, '+');
                const message = yield this.client.messages.create({
                    body: options.message,
                    to: normalizedPhone,
                    from: this.fromNumber,
                });
                logger_1.default.info('SMS sent successfully via Twilio', {
                    to: normalizedPhone,
                    messageSid: message.sid,
                });
            }
            catch (error) {
                logger_1.default.error('Failed to send SMS via Twilio', {
                    to: options.to,
                    error: error.message,
                    code: error.code,
                });
                throw error;
            }
        });
    }
}
/**
 * Console SMS Provider (for development/testing)
 * Logs SMS to console instead of sending
 */
class ConsoleSMSProvider {
    sendSMS(options) {
        return __awaiter(this, void 0, void 0, function* () {
            logger_1.default.info('SMS (Console Mode)', {
                to: options.to,
                message: options.message,
            });
            console.log('='.repeat(60));
            console.log('📱 SMS MESSAGE (Console Mode - Not Actually Sent)');
            console.log('To:', options.to);
            console.log('Message:', options.message);
            console.log('='.repeat(60));
        });
    }
}
// SMS Provider Factory
let smsProvider = null;
/**
 * Initialize SMS provider based on configuration
 */
const initializeSMSProvider = (provider, config) => {
    if (provider === 'twilio' && config) {
        const { accountSid, authToken, fromNumber } = config;
        if (accountSid && authToken && fromNumber) {
            smsProvider = new TwilioSMSProvider(accountSid, authToken, fromNumber);
            logger_1.default.info('SMS Provider initialized: Twilio');
        }
        else {
            logger_1.default.warn('Twilio SMS provider selected but credentials missing. Falling back to console mode.');
            smsProvider = new ConsoleSMSProvider();
        }
    }
    else if (provider === 'console') {
        smsProvider = new ConsoleSMSProvider();
        logger_1.default.info('SMS Provider initialized: Console (Development Mode)');
    }
    else {
        smsProvider = null;
        logger_1.default.info('SMS Provider: Disabled');
    }
};
exports.initializeSMSProvider = initializeSMSProvider;
/**
 * Send SMS
 * @param options SMS options
 * @returns Promise
 */
const sendSMS = (options) => __awaiter(void 0, void 0, void 0, function* () {
    if (!smsProvider) {
        logger_1.default.warn('SMS provider not initialized. SMS not sent. To enable SMS, configure SMS_PROVIDER and credentials in .env');
        throw new Error('SMS provider not configured');
    }
    // Normalize phone number (remove spaces, ensure + prefix)
    const normalizedPhone = options.to.replace(/\s+/g, '').replace(/^\+?/, '+');
    // Validate phone number format (E.164 format: + followed by 1-15 digits)
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(normalizedPhone)) {
        throw new Error(`Invalid phone number format. Phone number must be in E.164 format (e.g., +1234567890). Received: ${options.to}`);
    }
    yield smsProvider.sendSMS(Object.assign(Object.assign({}, options), { to: normalizedPhone }));
});
exports.sendSMS = sendSMS;
/**
 * Send OTP via SMS
 * @param phoneNumber Phone number to send OTP to
 * @param otp OTP code
 * @returns Promise
 */
const sendOTPSMS = (phoneNumber, otp) => __awaiter(void 0, void 0, void 0, function* () {
    const message = `Your Ogera verification code is: ${otp}. This code will expire in 10 minutes. Do not share this code with anyone.`;
    yield (0, exports.sendSMS)({
        to: phoneNumber,
        message,
    });
});
exports.sendOTPSMS = sendOTPSMS;
