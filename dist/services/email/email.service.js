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
exports.sendJobApplicationStatus = exports.sendWelcomeEmail = exports.sendPasswordChanged = exports.sendPasswordResetOTP = exports.sendEmailVerification = exports.emailService = exports.EmailType = void 0;
const mailer_1 = require("../../utils/mailer");
const emailTemplete_1 = require("../../templete/emailTemplete");
const logger_1 = __importDefault(require("../../utils/logger"));
var EmailType;
(function (EmailType) {
    // Authentication & Account
    EmailType["EMAIL_VERIFICATION"] = "EMAIL_VERIFICATION";
    EmailType["PASSWORD_RESET_OTP"] = "PASSWORD_RESET_OTP";
    EmailType["PASSWORD_CHANGED"] = "PASSWORD_CHANGED";
    EmailType["WELCOME"] = "WELCOME";
    EmailType["ACCOUNT_LOCKED"] = "ACCOUNT_LOCKED";
    EmailType["ACCOUNT_UNLOCKED"] = "ACCOUNT_UNLOCKED";
    // Job Application
    EmailType["JOB_APPLICATION_STATUS"] = "JOB_APPLICATION_STATUS";
    EmailType["JOB_APPLICATION_RECEIVED"] = "JOB_APPLICATION_RECEIVED";
    EmailType["JOB_POSTED"] = "JOB_POSTED";
    // Academic Verification
    EmailType["ACADEMIC_VERIFICATION_STATUS"] = "ACADEMIC_VERIFICATION_STATUS";
    // Custom
    EmailType["CUSTOM"] = "CUSTOM";
})(EmailType || (exports.EmailType = EmailType = {}));
class EmailService {
    /**
     * Send email based on type and data
     */
    sendEmail(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { type, to } = data;
                let emailOptions;
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
                return yield (0, mailer_1.sendMail)(emailOptions);
            }
            catch (error) {
                logger_1.default.error("Email service error", {
                    type: data.type,
                    to: data.to,
                    error: error.message,
                });
                throw error;
            }
        });
    }
    getEmailVerificationOptions(data) {
        if (!data.verificationLink || !data.verificationTokenExpiry) {
            throw new Error("verificationLink and verificationTokenExpiry are required for email verification");
        }
        const { html, text } = (0, emailTemplete_1.EmailVerificationTemplate)(data.verificationLink, data.verificationTokenExpiry);
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
    getPasswordResetOTPOptions(data) {
        if (!data.otp || !data.otpExpiry) {
            throw new Error("otp and otpExpiry are required for password reset");
        }
        const { html, text } = (0, emailTemplete_1.EmailTemplete)(data.otp, data.otpExpiry);
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
    getPasswordChangedOptions(data) {
        const { html, text } = (0, emailTemplete_1.PasswordChangedTemplate)(data.userName || "User");
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
    getWelcomeEmailOptions(data) {
        const { html, text } = (0, emailTemplete_1.WelcomeEmailTemplate)(data.userName || "User");
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
    getAccountLockedOptions(data) {
        const { html, text } = (0, emailTemplete_1.AccountLockedTemplate)(data.userName || "User");
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
    getAccountUnlockedOptions(data) {
        const { html, text } = (0, emailTemplete_1.AccountUnlockedTemplate)(data.userName || "User");
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
    getJobApplicationStatusOptions(data) {
        if (!data.jobTitle || !data.applicationStatus || !data.studentName) {
            throw new Error("jobTitle, applicationStatus, and studentName are required for job application status");
        }
        const { html, text } = (0, emailTemplete_1.JobApplicationStatusTemplate)(data.jobTitle, data.applicationStatus, data.studentName);
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
    getJobApplicationReceivedOptions(data) {
        if (!data.jobTitle || !data.studentName || !data.employerName) {
            throw new Error("jobTitle, studentName, and employerName are required for job application received");
        }
        const { html, text } = (0, emailTemplete_1.ApplicationReceivedTemplate)(data.jobTitle, data.studentName, data.employerName);
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
    getJobPostedOptions(data) {
        if (!data.jobTitle) {
            throw new Error("jobTitle is required for job posted email");
        }
        const { html, text } = (0, emailTemplete_1.JobPostedTemplate)(data.jobTitle, data.userName || "Employer");
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
    getAcademicVerificationStatusOptions(data) {
        if (!data.verificationStatus) {
            throw new Error("verificationStatus is required for academic verification status");
        }
        const { html, text } = (0, emailTemplete_1.AcademicVerificationStatusTemplate)(data.verificationStatus, data.userName || "Student", data.rejectionReason);
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
    getCustomEmailOptions(data) {
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
exports.emailService = new EmailService();
// Export convenience functions
const sendEmailVerification = (to, verificationLink, expiry) => __awaiter(void 0, void 0, void 0, function* () {
    return exports.emailService.sendEmail({
        to,
        type: EmailType.EMAIL_VERIFICATION,
        verificationLink,
        verificationTokenExpiry: expiry,
    });
});
exports.sendEmailVerification = sendEmailVerification;
const sendPasswordResetOTP = (to, otp, expiry) => __awaiter(void 0, void 0, void 0, function* () {
    return exports.emailService.sendEmail({
        to,
        type: EmailType.PASSWORD_RESET_OTP,
        otp,
        otpExpiry: expiry,
    });
});
exports.sendPasswordResetOTP = sendPasswordResetOTP;
const sendPasswordChanged = (to, userName) => __awaiter(void 0, void 0, void 0, function* () {
    return exports.emailService.sendEmail({
        to,
        type: EmailType.PASSWORD_CHANGED,
        userName,
    });
});
exports.sendPasswordChanged = sendPasswordChanged;
const sendWelcomeEmail = (to, userName) => __awaiter(void 0, void 0, void 0, function* () {
    return exports.emailService.sendEmail({
        to,
        type: EmailType.WELCOME,
        userName,
    });
});
exports.sendWelcomeEmail = sendWelcomeEmail;
const sendJobApplicationStatus = (to, jobTitle, status, studentName) => __awaiter(void 0, void 0, void 0, function* () {
    return exports.emailService.sendEmail({
        to,
        type: EmailType.JOB_APPLICATION_STATUS,
        jobTitle,
        applicationStatus: status,
        studentName,
    });
});
exports.sendJobApplicationStatus = sendJobApplicationStatus;
