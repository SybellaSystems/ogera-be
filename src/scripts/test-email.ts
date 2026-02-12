/**
 * Email Service Test Script
 * 
 * This script tests the SMTP email service configuration
 * Run with: npx ts-node src/scripts/test-email.ts
 */

import { emailService, EmailType } from '../services/email/email.service';
import { EMAIL_CONFIG } from '../config';
import logger from '../utils/logger';

async function testEmailService() {
    console.log('\n📧 Testing Email Service Configuration...\n');
    
    // Display configuration (without sensitive data)
    console.log('📋 Email Configuration:');
    console.log(`   Host: ${EMAIL_CONFIG.smtp.host}`);
    console.log(`   Port: ${EMAIL_CONFIG.smtp.port}`);
    console.log(`   Secure: ${EMAIL_CONFIG.smtp.secure}`);
    console.log(`   Service: ${EMAIL_CONFIG.smtp.service || 'Custom SMTP'}`);
    console.log(`   From: ${EMAIL_CONFIG.from.name} <${EMAIL_CONFIG.from.email}>`);
    console.log(`   Frontend URL: ${EMAIL_CONFIG.frontendUrl}\n`);
    
    // Test email recipient (change this to your email)
    const testEmail = process.env.TEST_EMAIL || 'test@example.com';
    
    if (testEmail === 'test@example.com') {
        console.log('⚠️  Warning: Using default test email. Set TEST_EMAIL environment variable to test with your email.\n');
    }
    
    const tests = [
        {
            name: 'Welcome Email',
            type: EmailType.WELCOME,
            data: {
                to: testEmail,
                type: EmailType.WELCOME,
                userName: 'Test User',
            },
        },
        {
            name: 'Email Verification',
            type: EmailType.EMAIL_VERIFICATION,
            data: {
                to: testEmail,
                type: EmailType.EMAIL_VERIFICATION,
                verificationLink: `${EMAIL_CONFIG.frontendUrl}/auth/verify-email?token=test-token-123`,
                verificationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
        },
        {
            name: 'Password Reset OTP',
            type: EmailType.PASSWORD_RESET_OTP,
            data: {
                to: testEmail,
                type: EmailType.PASSWORD_RESET_OTP,
                otp: '123456',
                otpExpiry: new Date(Date.now() + 15 * 60 * 1000),
            },
        },
    ];
    
    console.log('🧪 Running Email Tests...\n');
    
    for (const test of tests) {
        try {
            console.log(`   Testing: ${test.name}...`);
            await emailService.sendEmail(test.data);
            console.log(`   ✅ ${test.name} sent successfully!\n`);
            
            // Wait a bit between emails to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error: any) {
            console.error(`   ❌ ${test.name} failed:`, error.message);
            console.error(`   Error details:`, error.stack);
            console.log('');
        }
    }
    
    console.log('✨ Email service test completed!\n');
    console.log('📝 Check your email inbox for test emails.');
    console.log('📊 Check logs in src/logs/ for detailed information.\n');
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

