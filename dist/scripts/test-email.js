"use strict";
/**
 * Email Service Test Script
 *
 * This script tests the SMTP email service configuration
 * Run with: npx ts-node src/scripts/test-email.ts
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const email_service_1 = require("../services/email/email.service");
const config_1 = require("../config");
function testEmailService() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('\n📧 Testing Email Service Configuration...\n');
        // Display configuration (without sensitive data)
        console.log('📋 Email Configuration:');
        console.log(`   Host: ${config_1.EMAIL_CONFIG.smtp.host}`);
        console.log(`   Port: ${config_1.EMAIL_CONFIG.smtp.port}`);
        console.log(`   Secure: ${config_1.EMAIL_CONFIG.smtp.secure}`);
        console.log(`   Service: ${config_1.EMAIL_CONFIG.smtp.service || 'Custom SMTP'}`);
        console.log(`   From: ${config_1.EMAIL_CONFIG.from.name} <${config_1.EMAIL_CONFIG.from.email}>`);
        console.log(`   Frontend URL: ${config_1.EMAIL_CONFIG.frontendUrl}\n`);
        // Test email recipient (change this to your email)
        const testEmail = process.env.TEST_EMAIL || 'test@example.com';
        if (testEmail === 'test@example.com') {
            console.log('⚠️  Warning: Using default test email. Set TEST_EMAIL environment variable to test with your email.\n');
        }
        const tests = [
            {
                name: 'Welcome Email',
                type: email_service_1.EmailType.WELCOME,
                data: {
                    to: testEmail,
                    type: email_service_1.EmailType.WELCOME,
                    userName: 'Test User',
                },
            },
            {
                name: 'Email Verification',
                type: email_service_1.EmailType.EMAIL_VERIFICATION,
                data: {
                    to: testEmail,
                    type: email_service_1.EmailType.EMAIL_VERIFICATION,
                    verificationLink: `${config_1.EMAIL_CONFIG.frontendUrl}/auth/verify-email?token=test-token-123`,
                    verificationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
                },
            },
            {
                name: 'Password Reset OTP',
                type: email_service_1.EmailType.PASSWORD_RESET_OTP,
                data: {
                    to: testEmail,
                    type: email_service_1.EmailType.PASSWORD_RESET_OTP,
                    otp: '123456',
                    otpExpiry: new Date(Date.now() + 15 * 60 * 1000),
                },
            },
        ];
        console.log('🧪 Running Email Tests...\n');
        for (const test of tests) {
            try {
                console.log(`   Testing: ${test.name}...`);
                yield email_service_1.emailService.sendEmail(test.data);
                console.log(`   ✅ ${test.name} sent successfully!\n`);
                // Wait a bit between emails to avoid rate limiting
                yield new Promise(resolve => setTimeout(resolve, 1000));
            }
            catch (error) {
                console.error(`   ❌ ${test.name} failed:`, error.message);
                console.error(`   Error details:`, error.stack);
                console.log('');
            }
        }
        console.log('✨ Email service test completed!\n');
        console.log('📝 Check your email inbox for test emails.');
        console.log('📊 Check logs in src/logs/ for detailed information.\n');
    });
}
// Run the test
testEmailService()
    .then(() => {
    console.log('✅ Test script completed successfully');
    process.exit(0);
})
    .catch((error) => {
    console.error('❌ Test script failed:', error);
    process.exit(1);
});
