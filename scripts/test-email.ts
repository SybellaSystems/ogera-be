/**
 * Email Service Test Script
 *
 * This script tests the email service by sending a test email.
 *
 * Usage:
 *   npx ts-node scripts/test-email.ts <recipient-email>
 *
 * Example:
 *   npx ts-node scripts/test-email.ts test@example.com
 */

import { config } from 'dotenv';
import path from 'path';

// Load environment variables
const envFile = path.join(__dirname, '../.env.development');
config({ path: envFile });

import { emailService, EmailType } from '../src/services/email/email.service';
import logger from '../src/utils/logger';

async function testEmail() {
    // Get recipient email from command line argument
    const recipientEmail = process.argv[2];

    if (!recipientEmail) {
        console.error('❌ Error: Recipient email is required');
        console.log(
            '\nUsage: npx ts-node scripts/test-email.ts <recipient-email>',
        );
        console.log(
            'Example: npx ts-node scripts/test-email.ts test@example.com',
        );
        process.exit(1);
    }

    // Validate email format (basic)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
        console.error('❌ Error: Invalid email format');
        process.exit(1);
    }

    console.log('📧 Testing Email Service...\n');
    console.log(`Recipient: ${recipientEmail}`);
    console.log('---\n');

    try {
        // Test 1: Welcome Email
        console.log('1️⃣  Sending Welcome Email...');
        await emailService.sendEmail({
            to: recipientEmail,
            type: EmailType.WELCOME,
            userName: 'Test User',
        });
        console.log('   ✅ Welcome email sent successfully!\n');

        // Test 2: Custom Email
        console.log('2️⃣  Sending Custom Email...');
        await emailService.sendEmail({
            to: recipientEmail,
            type: EmailType.CUSTOM,
            subject: 'Test Email from Ogera',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>Email Service Test</h2>
                    <p>This is a test email to verify that the SMTP email service is working correctly.</p>
                    <p>If you received this email, your email configuration is correct! ✅</p>
                    <hr>
                    <p style="color: #666; font-size: 12px;">
                        Sent from Ogera Backend Email Service
                    </p>
                </div>
            `,
            text: 'Email Service Test\n\nThis is a test email to verify that the SMTP email service is working correctly.\n\nIf you received this email, your email configuration is correct!',
        });
        console.log('   ✅ Custom email sent successfully!\n');

        console.log('✅ All test emails sent successfully!');
        console.log(`\n📬 Check your inbox at: ${recipientEmail}`);
        console.log('   (Also check spam/junk folder if not found)');
    } catch (error: any) {
        console.error('\n❌ Failed to send test email:');
        console.error('   Error:', error.message);

        if (error.code) {
            console.error('   Error Code:', error.code);
        }

        if (error.response) {
            console.error('   SMTP Response:', error.response);
        }

        console.error('\n💡 Troubleshooting:');
        console.error(
            '   1. Check your SMTP configuration in .env.development',
        );
        console.error('   2. Verify SMTP credentials are correct');
        console.error(
            '   3. For Gmail: Use App Password, not regular password',
        );
        console.error('   4. Check firewall/network settings');
        console.error('   5. Review error logs in src/logs/error/');

        logger.error('Email test failed', {
            recipient: recipientEmail,
            error: error.message,
            stack: error.stack,
        });

        process.exit(1);
    }
}

// Run the test
testEmail()
    .then(() => {
        console.log('\n✨ Test completed!');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n💥 Unexpected error:', error);
        process.exit(1);
    });
