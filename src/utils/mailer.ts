import nodemailer, { Transporter } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import axios from 'axios';
import { basename } from 'path';
import { promises as fs } from 'fs';
import { EMAIL_CONFIG } from '@/config';
import logger from './logger';

// Create SMTP transporter
const createTransporter = (): Transporter => {
    const { smtp } = EMAIL_CONFIG;

    logger.info('Creating SMTP transporter', {
        host: smtp.host,
        port: smtp.port,
        secure: smtp.secure,
    });

    return nodemailer.createTransport({
        host: smtp.host,
        port: Number(smtp.port),
        secure: smtp.secure,
        requireTLS: !smtp.secure,

        auth: {
            user: smtp.auth.user,
            pass: smtp.auth.pass,
        },

        // Better timeout settings
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 20000,

        // Keep logs available in non-production only
        logger: process.env.NODE_ENV !== 'production',
        debug: process.env.NODE_ENV !== 'production',
    } as SMTPTransport.Options);
};

// Transporter instance
let transporter: Transporter | null = null;

const getTransporter = (): Transporter => {
    if (!transporter) {
        transporter = createTransporter();
    }

    return transporter;
};

type BrevoAttachment = {
    name: string;
    content: string;
};

const toAddressObjects = (value?: string | string[]) => {
    if (!value) return undefined;
    const list = Array.isArray(value) ? value : [value];
    return list.map(email => ({ email }));
};

const toBrevoAttachments = async (
    attachments?: EmailOptions['attachments'],
): Promise<BrevoAttachment[] | undefined> => {
    if (!attachments?.length) return undefined;

    const formatted = await Promise.all(
        attachments.map(async file => {
            if (typeof file.content === 'string') {
                return {
                    name: file.filename,
                    content: Buffer.from(file.content).toString('base64'),
                };
            }

            if (Buffer.isBuffer(file.content)) {
                return {
                    name: file.filename,
                    content: file.content.toString('base64'),
                };
            }

            if (file.path) {
                const buffer = await fs.readFile(file.path);
                return {
                    name: file.filename || basename(file.path),
                    content: buffer.toString('base64'),
                };
            }

            return null;
        }),
    );

    return formatted.filter((item): item is BrevoAttachment => item !== null);
};

const sendViaBrevoApi = async (options: EmailOptions): Promise<any> => {
    const { brevo } = EMAIL_CONFIG;
    const apiKey = brevo.apiKey;
    const senderEmail = brevo.senderEmail;
    const senderName = brevo.senderName;

    if (!apiKey) {
        throw new Error('BREVO_API_KEY (or REVO_API_KEY) is not configured');
    }

    if (!senderEmail) {
        throw new Error('BREVO_SENDER_EMAIL or EMAIL_FROM must be configured');
    }

    const payload = {
        sender: {
            name: senderName,
            email: senderEmail,
        },
        to: toAddressObjects(options.to),
        cc: toAddressObjects(options.cc),
        bcc: toAddressObjects(options.bcc),
        replyTo: options.replyTo ? { email: options.replyTo } : undefined,
        subject: options.subject,
        htmlContent: options.html,
        textContent: options.text ?? options.html.replace(/<[^>]+>/g, ''),
        attachment: await toBrevoAttachments(options.attachments),
    };

    let data: any;
    try {
        const response = await axios.post(brevo.apiUrl, payload, {
            headers: {
                'api-key': apiKey,
                'content-type': 'application/json',
                accept: 'application/json',
            },
            timeout: 15000,
        });
        data = response.data;
    } catch (error: any) {
        if (axios.isAxiosError(error)) {
            logger.error('Brevo API email send failed', {
                status: error.response?.status,
                data: error.response?.data,
                code: error.code,
                message: error.message,
                senderEmail,
                to: options.to,
                subject: options.subject,
            });
        }
        throw error;
    }

    logger.info('Email sent successfully via Brevo API', {
        to: options.to,
        subject: options.subject,
        messageId: data?.messageId,
    });

    return data;
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
 */
export const sendMail = async (options: EmailOptions): Promise<any> => {
    const { from, provider } = EMAIL_CONFIG;

    try {
        if (provider === 'brevo_api') {
            return await sendViaBrevoApi(options);
        }

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
        const isSmtpConnectivityError =
            error?.code === 'ETIMEDOUT' ||
            error?.code === 'ECONNECTION' ||
            error?.code === 'ECONNREFUSED' ||
            /Connection timeout|connect|greeting timeout/i.test(
                error?.message || '',
            );

        if (isSmtpConnectivityError && EMAIL_CONFIG.brevo.apiKey) {
            logger.warn('SMTP failed, retrying via Brevo API fallback', {
                code: error?.code,
                message: error?.message,
            });
            return sendViaBrevoApi(options);
        }

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
 * Legacy function
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
