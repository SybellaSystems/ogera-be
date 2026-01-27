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
exports.sendMailLegacy = exports.sendMail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const config_1 = require("../config");
const logger_1 = __importDefault(require("./logger"));
// Create SMTP transporter with flexible configuration
const createTransporter = () => {
    const { smtp } = config_1.EMAIL_CONFIG;
    // If service is provided, use it (simpler configuration)
    if (smtp.service) {
        return nodemailer_1.default.createTransport({
            service: smtp.service,
            auth: {
                user: smtp.auth.user,
                pass: smtp.auth.pass,
            },
        });
    }
    // Otherwise, use full SMTP configuration
    return nodemailer_1.default.createTransport({
        host: smtp.host,
        port: smtp.port,
        secure: smtp.secure, // true for 465, false for other ports
        auth: {
            user: smtp.auth.user,
            pass: smtp.auth.pass,
        },
        // Additional options for better compatibility
        tls: {
            rejectUnauthorized: false, // Allow self-signed certificates (set to true in production with valid certs)
        },
    });
};
// Create transporter instance
let transporter = null;
const getTransporter = () => {
    if (!transporter) {
        transporter = createTransporter();
        // Verify connection on first use
        transporter.verify(error => {
            if (error) {
                logger_1.default.error('SMTP connection verification failed:', error);
            }
            else {
                logger_1.default.info('SMTP server is ready to send emails');
            }
        });
    }
    return transporter;
};
/**
 * Send email using SMTP
 * @param options Email options
 * @returns Promise with message info
 */
const sendMail = (options) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { from } = config_1.EMAIL_CONFIG;
    try {
        const mailOptions = {
            from: `"${from.name}" <${from.email}>`,
            to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
            subject: options.subject,
            html: options.html,
            text: (_a = options.text) !== null && _a !== void 0 ? _a : options.html.replace(/<[^>]+>/g, ''),
            cc: options.cc
                ? Array.isArray(options.cc)
                    ? options.cc.join(', ')
                    : options.cc
                : undefined,
            bcc: options.bcc
                ? Array.isArray(options.bcc)
                    ? options.bcc.join(', ')
                    : options.bcc
                : undefined,
            replyTo: options.replyTo,
            attachments: options.attachments,
        };
        const info = yield getTransporter().sendMail(mailOptions);
        logger_1.default.info('Email sent successfully', {
            to: options.to,
            subject: options.subject,
            messageId: info.messageId,
        });
        return info;
    }
    catch (error) {
        logger_1.default.error('Failed to send email', {
            to: options.to,
            subject: options.subject,
            error: error.message,
            stack: error.stack,
        });
        throw error;
    }
});
exports.sendMail = sendMail;
/**
 * Legacy function signature for backward compatibility
 * @deprecated Use sendMail with EmailOptions instead
 */
const sendMailLegacy = (to, subject, html, text) => __awaiter(void 0, void 0, void 0, function* () {
    return (0, exports.sendMail)({
        to,
        subject,
        html,
        text,
    });
});
exports.sendMailLegacy = sendMailLegacy;
