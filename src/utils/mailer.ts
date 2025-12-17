import nodemailer, { Transporter } from 'nodemailer';
import { EMAIL_CONFIG } from '@/config';
import logger from './logger';

// Create SMTP transporter with flexible configuration
const createTransporter = (): Transporter => {
    const { smtp } = EMAIL_CONFIG;

    // If service is provided, use it (simpler configuration)
    if (smtp.service) {
        return nodemailer.createTransport({
            service: smtp.service,
            auth: {
                user: smtp.auth.user,
                pass: smtp.auth.pass,
            },
        });
    }

    // Otherwise, use full SMTP configuration
    return nodemailer.createTransport({
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
let transporter: Transporter | null = null;

const getTransporter = (): Transporter => {
    if (!transporter) {
        transporter = createTransporter();

        // Verify connection on first use
        transporter.verify(error => {
            if (error) {
                logger.error('SMTP connection verification failed:', error);
            } else {
                logger.info('SMTP server is ready to send emails');
            }
        });
    }
    return transporter;
};

export interface EmailOptions {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
    cc?: string | string[];
    bcc?: string | string[];
    replyTo?: string;
    attachments?: Array<{
        filename: string;
        path?: string;
        content?: string | Buffer;
        contentType?: string;
    }>;
}

/**
 * Send email using SMTP
 * @param options Email options
 * @returns Promise with message info
 */
export const sendMail = async (options: EmailOptions): Promise<any> => {
    const { from } = EMAIL_CONFIG;

    try {
        const mailOptions = {
            from: `"${from.name}" <${from.email}>`,
            to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
            subject: options.subject,
            html: options.html,
            text: options.text ?? options.html.replace(/<[^>]+>/g, ''),
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

        const info = await getTransporter().sendMail(mailOptions);

        logger.info('Email sent successfully', {
            to: options.to,
            subject: options.subject,
            messageId: info.messageId,
        });

        return info;
    } catch (error: any) {
        logger.error('Failed to send email', {
            to: options.to,
            subject: options.subject,
            error: error.message,
            stack: error.stack,
        });
        throw error;
    }
};

/**
 * Legacy function signature for backward compatibility
 * @deprecated Use sendMail with EmailOptions instead
 */
export const sendMailLegacy = async (
    to: string,
    subject: string,
    html: string,
    text?: string,
): Promise<any> => {
    return sendMail({
        to,
        subject,
        html,
        text,
    });
};
