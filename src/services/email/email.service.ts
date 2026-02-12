import { sendMail, EmailOptions } from "@/utils/mailer";
import {
    EmailTemplete,
    EmailVerificationTemplate,
    JobApplicationStatusTemplate,
    WelcomeEmailTemplate,
    PasswordChangedTemplate,
    AccountLockedTemplate,
    AccountUnlockedTemplate,
    JobPostedTemplate,
    ApplicationReceivedTemplate,
    AcademicVerificationStatusTemplate,
} from "@/templete/emailTemplete";
import { EMAIL_CONFIG } from "@/config";
import logger from "@/utils/logger";

export enum EmailType {
    // Authentication & Account
    EMAIL_VERIFICATION = "EMAIL_VERIFICATION",
    PASSWORD_RESET_OTP = "PASSWORD_RESET_OTP",
    PASSWORD_CHANGED = "PASSWORD_CHANGED",
    WELCOME = "WELCOME",
    ACCOUNT_LOCKED = "ACCOUNT_LOCKED",
    ACCOUNT_UNLOCKED = "ACCOUNT_UNLOCKED",
    
    // Job Application
    JOB_APPLICATION_STATUS = "JOB_APPLICATION_STATUS",
    JOB_APPLICATION_RECEIVED = "JOB_APPLICATION_RECEIVED",
    JOB_POSTED = "JOB_POSTED",
    
    // Academic Verification
    ACADEMIC_VERIFICATION_STATUS = "ACADEMIC_VERIFICATION_STATUS",
    
    // Custom
    CUSTOM = "CUSTOM",
}

export interface EmailData {
    // Common fields
    to: string | string[];
    type: EmailType;
    
    // Email verification
    verificationLink?: string;
    verificationTokenExpiry?: Date;
    
    // Password reset
    otp?: string;
    otpExpiry?: Date;
    
    // Job application
    jobTitle?: string;
    applicationStatus?: "Accepted" | "Rejected";
    studentName?: string;
    employerName?: string;
    
    // Welcome
    userName?: string;
    
    // Academic verification
    verificationStatus?: "Approved" | "Rejected";
    rejectionReason?: string;
    
    // Custom
    subject?: string;
    html?: string;
    text?: string;
    
    // Additional options
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

class EmailService {
    /**
     * Send email based on type and data
     */
    async sendEmail(data: EmailData): Promise<any> {
        try {
            const { type, to } = data;
            
            let emailOptions: EmailOptions;
            
            switch (type) {
                case EmailType.EMAIL_VERIFICATION:
                    emailOptions = this.getEmailVerificationOptions(data);
                    break;
                    
                case EmailType.PASSWORD_RESET_OTP:
                    emailOptions = this.getPasswordResetOTPOptions(data);
                    break;
                    
                case EmailType.PASSWORD_CHANGED:
                    emailOptions = this.getPasswordChangedOptions(data);
                    break;
                    
                case EmailType.WELCOME:
                    emailOptions = this.getWelcomeEmailOptions(data);
                    break;
                    
                case EmailType.ACCOUNT_LOCKED:
                    emailOptions = this.getAccountLockedOptions(data);
                    break;
                    
                case EmailType.ACCOUNT_UNLOCKED:
                    emailOptions = this.getAccountUnlockedOptions(data);
                    break;
                    
                case EmailType.JOB_APPLICATION_STATUS:
                    emailOptions = this.getJobApplicationStatusOptions(data);
                    break;
                    
                case EmailType.JOB_APPLICATION_RECEIVED:
                    emailOptions = this.getJobApplicationReceivedOptions(data);
                    break;
                    
                case EmailType.JOB_POSTED:
                    emailOptions = this.getJobPostedOptions(data);
                    break;
                    
                case EmailType.ACADEMIC_VERIFICATION_STATUS:
                    emailOptions = this.getAcademicVerificationStatusOptions(data);
                    break;
                    
                case EmailType.CUSTOM:
                    emailOptions = this.getCustomEmailOptions(data);
                    break;
                    
                default:
                    throw new Error(`Unknown email type: ${type}`);
            }
            
            return await sendMail(emailOptions);
        } catch (error: any) {
            logger.error("Email service error", {
                type: data.type,
                to: data.to,
                error: error.message,
            });
            throw error;
        }
    }
    
    private getEmailVerificationOptions(data: EmailData): EmailOptions {
        if (!data.verificationLink || !data.verificationTokenExpiry) {
            throw new Error("verificationLink and verificationTokenExpiry are required for email verification");
        }
        
        const { html, text } = EmailVerificationTemplate(
            data.verificationLink,
            data.verificationTokenExpiry
        );
        
        return {
            to: data.to,
            subject: "Verify Your Email Address - Ogera",
            html,
            text,
            cc: data.cc,
            bcc: data.bcc,
            replyTo: data.replyTo,
            attachments: data.attachments,
        };
    }
    
    private getPasswordResetOTPOptions(data: EmailData): EmailOptions {
        if (!data.otp || !data.otpExpiry) {
            throw new Error("otp and otpExpiry are required for password reset");
        }
        
        const { html, text } = EmailTemplete(data.otp, data.otpExpiry);
        
        return {
            to: data.to,
            subject: "Password Reset OTP - Ogera",
            html,
            text,
            cc: data.cc,
            bcc: data.bcc,
            replyTo: data.replyTo,
            attachments: data.attachments,
        };
    }
    
    private getPasswordChangedOptions(data: EmailData): EmailOptions {
        const { html, text } = PasswordChangedTemplate(data.userName || "User");
        
        return {
            to: data.to,
            subject: "Password Changed Successfully - Ogera",
            html,
            text,
            cc: data.cc,
            bcc: data.bcc,
            replyTo: data.replyTo,
            attachments: data.attachments,
        };
    }
    
    private getWelcomeEmailOptions(data: EmailData): EmailOptions {
        const { html, text } = WelcomeEmailTemplate(data.userName || "User");
        
        return {
            to: data.to,
            subject: "Welcome to Ogera!",
            html,
            text,
            cc: data.cc,
            bcc: data.bcc,
            replyTo: data.replyTo,
            attachments: data.attachments,
        };
    }
    
    private getAccountLockedOptions(data: EmailData): EmailOptions {
        const { html, text } = AccountLockedTemplate(data.userName || "User");
        
        return {
            to: data.to,
            subject: "Account Locked - Ogera",
            html,
            text,
            cc: data.cc,
            bcc: data.bcc,
            replyTo: data.replyTo,
            attachments: data.attachments,
        };
    }
    
    private getAccountUnlockedOptions(data: EmailData): EmailOptions {
        const { html, text } = AccountUnlockedTemplate(data.userName || "User");
        
        return {
            to: data.to,
            subject: "Account Unlocked - Ogera",
            html,
            text,
            cc: data.cc,
            bcc: data.bcc,
            replyTo: data.replyTo,
            attachments: data.attachments,
        };
    }
    
    private getJobApplicationStatusOptions(data: EmailData): EmailOptions {
        if (!data.jobTitle || !data.applicationStatus || !data.studentName) {
            throw new Error("jobTitle, applicationStatus, and studentName are required for job application status");
        }
        
        const { html, text } = JobApplicationStatusTemplate(
            data.jobTitle,
            data.applicationStatus,
            data.studentName
        );
        
        return {
            to: data.to,
            subject: `Job Application ${data.applicationStatus}: ${data.jobTitle}`,
            html,
            text,
            cc: data.cc,
            bcc: data.bcc,
            replyTo: data.replyTo,
            attachments: data.attachments,
        };
    }
    
    private getJobApplicationReceivedOptions(data: EmailData): EmailOptions {
        if (!data.jobTitle || !data.studentName || !data.employerName) {
            throw new Error("jobTitle, studentName, and employerName are required for job application received");
        }
        
        const { html, text } = ApplicationReceivedTemplate(
            data.jobTitle,
            data.studentName,
            data.employerName
        );
        
        return {
            to: data.to,
            subject: `New Application Received: ${data.jobTitle}`,
            html,
            text,
            cc: data.cc,
            bcc: data.bcc,
            replyTo: data.replyTo,
            attachments: data.attachments,
        };
    }
    
    private getJobPostedOptions(data: EmailData): EmailOptions {
        if (!data.jobTitle) {
            throw new Error("jobTitle is required for job posted email");
        }
        
        const { html, text } = JobPostedTemplate(data.jobTitle, data.userName || "Employer");
        
        return {
            to: data.to,
            subject: `Job Posted Successfully: ${data.jobTitle}`,
            html,
            text,
            cc: data.cc,
            bcc: data.bcc,
            replyTo: data.replyTo,
            attachments: data.attachments,
        };
    }
    
    private getAcademicVerificationStatusOptions(data: EmailData): EmailOptions {
        if (!data.verificationStatus) {
            throw new Error("verificationStatus is required for academic verification status");
        }
        
        const { html, text } = AcademicVerificationStatusTemplate(
            data.verificationStatus,
            data.userName || "Student",
            data.rejectionReason
        );
        
        return {
            to: data.to,
            subject: `Academic Verification ${data.verificationStatus} - Ogera`,
            html,
            text,
            cc: data.cc,
            bcc: data.bcc,
            replyTo: data.replyTo,
            attachments: data.attachments,
        };
    }
    
    private getCustomEmailOptions(data: EmailData): EmailOptions {
        if (!data.subject || !data.html) {
            throw new Error("subject and html are required for custom email");
        }
        
        return {
            to: data.to,
            subject: data.subject,
            html: data.html,
            text: data.text,
            cc: data.cc,
            bcc: data.bcc,
            replyTo: data.replyTo,
            attachments: data.attachments,
        };
    }
}

// Export singleton instance
export const emailService = new EmailService();

// Export convenience functions
export const sendEmailVerification = async (
    to: string,
    verificationLink: string,
    expiry: Date
) => {
    return emailService.sendEmail({
        to,
        type: EmailType.EMAIL_VERIFICATION,
        verificationLink,
        verificationTokenExpiry: expiry,
    });
};

export const sendPasswordResetOTP = async (
    to: string,
    otp: string,
    expiry: Date
) => {
    return emailService.sendEmail({
        to,
        type: EmailType.PASSWORD_RESET_OTP,
        otp,
        otpExpiry: expiry,
    });
};

export const sendPasswordChanged = async (to: string, userName?: string) => {
    return emailService.sendEmail({
        to,
        type: EmailType.PASSWORD_CHANGED,
        userName,
    });
};

export const sendWelcomeEmail = async (to: string, userName?: string) => {
    return emailService.sendEmail({
        to,
        type: EmailType.WELCOME,
        userName,
    });
};

export const sendJobApplicationStatus = async (
    to: string,
    jobTitle: string,
    status: "Accepted" | "Rejected",
    studentName: string
) => {
    return emailService.sendEmail({
        to,
        type: EmailType.JOB_APPLICATION_STATUS,
        jobTitle,
        applicationStatus: status,
        studentName,
    });
};

