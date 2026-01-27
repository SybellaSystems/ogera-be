"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceTemplate = exports.SubscriptionConfirmationTemplate = exports.PaymentConfirmationTemplate = exports.OrderConfirmationTemplate = exports.AcademicVerificationStatusTemplate = exports.ApplicationReceivedTemplate = exports.JobPostedTemplate = exports.AccountUnlockedTemplate = exports.AccountLockedTemplate = exports.PasswordChangedTemplate = exports.WelcomeEmailTemplate = exports.JobApplicationStatusTemplate = exports.EmailVerificationTemplate = exports.EmailTemplete = void 0;
const EmailTemplete = (otp, expiry) => {
    const expiryText = expiry.toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'short',
    });
    const text = `Hello,

We received a request to reset your password.

Your One-Time Password (OTP) is: ${otp}

This OTP will expire at ${expiryText}.

If you did not request a password reset, you can safely ignore this email.

Thank you,
The Ogera Team`;
    const html = `
  <div style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
      <h2 style="color: #333;">Hello,</h2>
      <p style="color: #555; font-size: 16px;">
        We received a request to reset your password.
      </p>
      <p style="color: #555; font-size: 16px;">
        Your One-Time Password (OTP) is:
      </p>
      <div style="text-align: center; margin: 20px 0;">
        <span style="display: inline-block; font-size: 28px; font-weight: bold; color: #ffffff; background: #4CAF50; padding: 12px 24px; border-radius: 8px; letter-spacing: 3px;">
          ${otp}
        </span>
      </div>
      <p style="color: #555; font-size: 16px;">
        This OTP will expire at <b>${expiryText}</b>.
      </p>
      <p style="color: #555; font-size: 16px;">
        If you did not request a password reset, you can safely ignore this email.
      </p>
      <br/>
      <p style="color: #333; font-size: 16px;">
        Thank you,<br/>The <b>Ogera Team</b>
      </p>
    </div>
  </div>
  `;
    return { text, html };
};
exports.EmailTemplete = EmailTemplete;
const EmailVerificationTemplate = (verificationLink, expiry) => {
    const expiryText = expiry.toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'short',
    });
    const text = `Hello,

Welcome to Ogera! Please verify your email address to complete your registration.

Click the link below to verify your email:
${verificationLink}

This link will expire at ${expiryText}.

If you did not create an account, you can safely ignore this email.

Thank you,
The Ogera Team`;
    const html = `
  <div style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
      <h2 style="color: #333;">Hello,</h2>
      <p style="color: #555; font-size: 16px;">
        Welcome to Ogera! Please verify your email address to complete your registration.
      </p>
      <p style="color: #555; font-size: 16px;">
        Click the button below to verify your email:
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationLink}" style="display: inline-block; background: #7f56d9; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
          Verify Email Address
        </a>
      </div>
      <p style="color: #555; font-size: 14px; margin-top: 20px;">
        Or copy and paste this link into your browser:
      </p>
      <p style="color: #7f56d9; font-size: 12px; word-break: break-all; background: #f3ebff; padding: 10px; border-radius: 4px;">
        ${verificationLink}
      </p>
      <p style="color: #555; font-size: 14px; margin-top: 20px;">
        This link will expire at <b>${expiryText}</b>.
      </p>
      <p style="color: #555; font-size: 14px;">
        If you did not create an account, you can safely ignore this email.
      </p>
      <br/>
      <p style="color: #333; font-size: 16px;">
        Thank you,<br/>The <b>Ogera Team</b>
      </p>
    </div>
  </div>
  `;
    return { text, html };
};
exports.EmailVerificationTemplate = EmailVerificationTemplate;
const JobApplicationStatusTemplate = (jobTitle, status, studentName) => {
    const statusColor = status === 'Accepted' ? '#4CAF50' : '#f44336';
    const statusMessage = status === 'Accepted'
        ? 'Congratulations! Your application has been accepted.'
        : 'We regret to inform you that your application has been rejected.';
    const text = `Hello ${studentName},

${statusMessage}

Job Title: ${jobTitle}
Status: ${status}

${status === 'Accepted'
        ? 'The employer will contact you soon with further details.'
        : 'We encourage you to apply for other opportunities that match your skills.'}

Thank you for your interest,
The Ogera Team`;
    const html = `
  <div style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
      <h2 style="color: #333;">Hello ${studentName},</h2>
      <p style="color: #555; font-size: 16px;">
        ${statusMessage}
      </p>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="color: #333; font-size: 16px; margin: 5px 0;">
          <strong>Job Title:</strong> ${jobTitle}
        </p>
        <p style="color: #333; font-size: 16px; margin: 5px 0;">
          <strong>Status:</strong> 
          <span style="color: ${statusColor}; font-weight: bold;">${status}</span>
        </p>
      </div>
      ${status === 'Accepted'
        ? '<p style="color: #555; font-size: 16px;">The employer will contact you soon with further details.</p>'
        : '<p style="color: #555; font-size: 16px;">We encourage you to apply for other opportunities that match your skills.</p>'}
      <br/>
      <p style="color: #333; font-size: 16px;">
        Thank you for your interest,<br/>The <b>Ogera Team</b>
      </p>
    </div>
  </div>
  `;
    return { text, html };
};
exports.JobApplicationStatusTemplate = JobApplicationStatusTemplate;
// Welcome Email Template
const WelcomeEmailTemplate = (userName) => {
    const text = `Hello ${userName},

Welcome to Ogera! We're excited to have you join our platform.

Your account has been successfully created. You can now:
- Browse and apply for job opportunities
- Create and manage your profile
- Connect with employers
- Track your applications

If you have any questions, feel free to reach out to our support team.

Thank you for choosing Ogera!

Best regards,
The Ogera Team`;
    const html = `
  <div style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
      <h2 style="color: #333; text-align: center;">Welcome to Ogera!</h2>
      <p style="color: #555; font-size: 16px;">
        Hello ${userName},
      </p>
      <p style="color: #555; font-size: 16px;">
        We're excited to have you join our platform. Your account has been successfully created.
      </p>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="color: #333; font-size: 16px; margin: 10px 0;">
          <strong>You can now:</strong>
        </p>
        <ul style="color: #555; font-size: 16px; padding-left: 20px;">
          <li>Browse and apply for job opportunities</li>
          <li>Create and manage your profile</li>
          <li>Connect with employers</li>
          <li>Track your applications</li>
        </ul>
      </div>
      <p style="color: #555; font-size: 16px;">
        If you have any questions, feel free to reach out to our support team.
      </p>
      <br/>
      <p style="color: #333; font-size: 16px;">
        Thank you for choosing Ogera!<br/>
        Best regards,<br/>The <b>Ogera Team</b>
      </p>
    </div>
  </div>
  `;
    return { text, html };
};
exports.WelcomeEmailTemplate = WelcomeEmailTemplate;
// Password Changed Template
const PasswordChangedTemplate = (userName) => {
    const text = `Hello ${userName},

Your password has been successfully changed.

If you did not make this change, please contact our support team immediately to secure your account.

Thank you,
The Ogera Team`;
    const html = `
  <div style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
      <h2 style="color: #333;">Password Changed Successfully</h2>
      <p style="color: #555; font-size: 16px;">
        Hello ${userName},
      </p>
      <p style="color: #555; font-size: 16px;">
        Your password has been successfully changed.
      </p>
      <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="color: #856404; font-size: 14px; margin: 0;">
          <strong>⚠️ Security Notice:</strong> If you did not make this change, please contact our support team immediately to secure your account.
        </p>
      </div>
      <br/>
      <p style="color: #333; font-size: 16px;">
        Thank you,<br/>The <b>Ogera Team</b>
      </p>
    </div>
  </div>
  `;
    return { text, html };
};
exports.PasswordChangedTemplate = PasswordChangedTemplate;
// Account Locked Template
const AccountLockedTemplate = (userName) => {
    const text = `Hello ${userName},

Your account has been temporarily locked due to multiple failed login attempts.

For security reasons, your account will remain locked for 30 minutes. After this period, you can try logging in again.

If you believe this is an error or if you need immediate assistance, please contact our support team.

Thank you,
The Ogera Team`;
    const html = `
  <div style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
      <h2 style="color: #f44336;">Account Locked</h2>
      <p style="color: #555; font-size: 16px;">
        Hello ${userName},
      </p>
      <p style="color: #555; font-size: 16px;">
        Your account has been temporarily locked due to multiple failed login attempts.
      </p>
      <div style="background: #ffebee; border-left: 4px solid #f44336; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="color: #c62828; font-size: 14px; margin: 0;">
          <strong>Lock Duration:</strong> 30 minutes<br/>
          After this period, you can try logging in again.
        </p>
      </div>
      <p style="color: #555; font-size: 16px;">
        If you believe this is an error or if you need immediate assistance, please contact our support team.
      </p>
      <br/>
      <p style="color: #333; font-size: 16px;">
        Thank you,<br/>The <b>Ogera Team</b>
      </p>
    </div>
  </div>
  `;
    return { text, html };
};
exports.AccountLockedTemplate = AccountLockedTemplate;
// Account Unlocked Template
const AccountUnlockedTemplate = (userName) => {
    const text = `Hello ${userName},

Your account has been unlocked and you can now log in again.

If you did not request this unlock, please contact our support team immediately.

Thank you,
The Ogera Team`;
    const html = `
  <div style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
      <h2 style="color: #4CAF50;">Account Unlocked</h2>
      <p style="color: #555; font-size: 16px;">
        Hello ${userName},
      </p>
      <p style="color: #555; font-size: 16px;">
        Your account has been unlocked and you can now log in again.
      </p>
      <div style="background: #e8f5e9; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="color: #2e7d32; font-size: 14px; margin: 0;">
          ✅ You can now access your account normally.
        </p>
      </div>
      <p style="color: #555; font-size: 16px;">
        If you did not request this unlock, please contact our support team immediately.
      </p>
      <br/>
      <p style="color: #333; font-size: 16px;">
        Thank you,<br/>The <b>Ogera Team</b>
      </p>
    </div>
  </div>
  `;
    return { text, html };
};
exports.AccountUnlockedTemplate = AccountUnlockedTemplate;
// Job Posted Template
const JobPostedTemplate = (jobTitle, employerName) => {
    const text = `Hello ${employerName},

Your job posting has been successfully created and is now live on Ogera.

Job Title: ${jobTitle}

Students can now view and apply for this position. You will receive notifications when applications are submitted.

Thank you for using Ogera!

Best regards,
The Ogera Team`;
    const html = `
  <div style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
      <h2 style="color: #333;">Job Posted Successfully!</h2>
      <p style="color: #555; font-size: 16px;">
        Hello ${employerName},
      </p>
      <p style="color: #555; font-size: 16px;">
        Your job posting has been successfully created and is now live on Ogera.
      </p>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="color: #333; font-size: 16px; margin: 5px 0;">
          <strong>Job Title:</strong> ${jobTitle}
        </p>
      </div>
      <p style="color: #555; font-size: 16px;">
        Students can now view and apply for this position. You will receive notifications when applications are submitted.
      </p>
      <br/>
      <p style="color: #333; font-size: 16px;">
        Thank you for using Ogera!<br/>
        Best regards,<br/>The <b>Ogera Team</b>
      </p>
    </div>
  </div>
  `;
    return { text, html };
};
exports.JobPostedTemplate = JobPostedTemplate;
// Application Received Template
const ApplicationReceivedTemplate = (jobTitle, studentName, employerName) => {
    const text = `Hello ${employerName},

You have received a new job application.

Job Title: ${jobTitle}
Applicant: ${studentName}

Please review the application in your dashboard.

Thank you,
The Ogera Team`;
    const html = `
  <div style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
      <h2 style="color: #333;">New Application Received</h2>
      <p style="color: #555; font-size: 16px;">
        Hello ${employerName},
      </p>
      <p style="color: #555; font-size: 16px;">
        You have received a new job application.
      </p>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="color: #333; font-size: 16px; margin: 5px 0;">
          <strong>Job Title:</strong> ${jobTitle}
        </p>
        <p style="color: #333; font-size: 16px; margin: 5px 0;">
          <strong>Applicant:</strong> ${studentName}
        </p>
      </div>
      <p style="color: #555; font-size: 16px;">
        Please review the application in your dashboard.
      </p>
      <br/>
      <p style="color: #333; font-size: 16px;">
        Thank you,<br/>The <b>Ogera Team</b>
      </p>
    </div>
  </div>
  `;
    return { text, html };
};
exports.ApplicationReceivedTemplate = ApplicationReceivedTemplate;
// Academic Verification Status Template
const AcademicVerificationStatusTemplate = (status, studentName, rejectionReason) => {
    const statusColor = status === 'Approved' ? '#4CAF50' : '#f44336';
    const statusMessage = status === 'Approved'
        ? 'Congratulations! Your academic verification has been approved.'
        : 'We regret to inform you that your academic verification has been rejected.';
    const text = `Hello ${studentName},

${statusMessage}

Status: ${status}
${status === 'Rejected' && rejectionReason ? `Reason: ${rejectionReason}` : ''}

${status === 'Approved'
        ? 'You can now use this verification for your job applications.'
        : 'Please review the reason and resubmit if needed.'}

Thank you,
The Ogera Team`;
    const html = `
  <div style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
      <h2 style="color: #333;">Academic Verification ${status}</h2>
      <p style="color: #555; font-size: 16px;">
        Hello ${studentName},
      </p>
      <p style="color: #555; font-size: 16px;">
        ${statusMessage}
      </p>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="color: #333; font-size: 16px; margin: 5px 0;">
          <strong>Status:</strong> 
          <span style="color: ${statusColor}; font-weight: bold;">${status}</span>
        </p>
        ${status === 'Rejected' && rejectionReason
        ? `
        <p style="color: #333; font-size: 16px; margin: 5px 0;">
          <strong>Reason:</strong> ${rejectionReason}
        </p>
        `
        : ''}
      </div>
      ${status === 'Approved'
        ? `
      <p style="color: #555; font-size: 16px;">
        You can now use this verification for your job applications.
      </p>
      `
        : `
      <p style="color: #555; font-size: 16px;">
        Please review the reason and resubmit if needed.
      </p>
      `}
      <br/>
      <p style="color: #333; font-size: 16px;">
        Thank you,<br/>The <b>Ogera Team</b>
      </p>
    </div>
  </div>
  `;
    return { text, html };
};
exports.AcademicVerificationStatusTemplate = AcademicVerificationStatusTemplate;
// Order Confirmation Template
const OrderConfirmationTemplate = (orderNumber, customerName, items, totalAmount, orderDate) => {
    const orderDateText = orderDate.toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'short',
    });
    const itemsList = items
        .map(item => `  - ${item.name} (Qty: ${item.quantity}) - $${item.price.toFixed(2)}`)
        .join('\n');
    const text = `Hello ${customerName},

Thank you for your order! We've received your order and it's being processed.

Order Number: ${orderNumber}
Order Date: ${orderDateText}

Items:
${itemsList}

Total Amount: $${totalAmount.toFixed(2)}

You will receive another email when your order ships.

Thank you for choosing Ogera!

Best regards,
The Ogera Team`;
    const itemsHtml = items
        .map(item => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.price.toFixed(2)}</td>
        </tr>`)
        .join('');
    const html = `
  <div style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
      <h2 style="color: #333; text-align: center;">Order Confirmation</h2>
      <p style="color: #555; font-size: 16px;">
        Hello ${customerName},
      </p>
      <p style="color: #555; font-size: 16px;">
        Thank you for your order! We've received your order and it's being processed.
      </p>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="color: #333; font-size: 16px; margin: 5px 0;">
          <strong>Order Number:</strong> ${orderNumber}
        </p>
        <p style="color: #333; font-size: 16px; margin: 5px 0;">
          <strong>Order Date:</strong> ${orderDateText}
        </p>
      </div>
      <h3 style="color: #333; margin-top: 30px;">Order Items</h3>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background: #f5f5f5;">
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Item</th>
            <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Quantity</th>
            <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold; border-top: 2px solid #ddd;">Total:</td>
            <td style="padding: 10px; text-align: right; font-weight: bold; border-top: 2px solid #ddd;">$${totalAmount.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
      <p style="color: #555; font-size: 16px;">
        You will receive another email when your order ships.
      </p>
      <br/>
      <p style="color: #333; font-size: 16px;">
        Thank you for choosing Ogera!<br/>
        Best regards,<br/>The <b>Ogera Team</b>
      </p>
    </div>
  </div>
  `;
    return { text, html };
};
exports.OrderConfirmationTemplate = OrderConfirmationTemplate;
// Payment Confirmation Template
const PaymentConfirmationTemplate = (customerName, transactionId, amount, paymentMethod, paymentDate, description) => {
    const paymentDateText = paymentDate.toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'short',
    });
    const text = `Hello ${customerName},

Your payment has been successfully processed.

Transaction ID: ${transactionId}
Amount: $${amount.toFixed(2)}
Payment Method: ${paymentMethod}
Payment Date: ${paymentDateText}
${description ? `Description: ${description}` : ''}

Thank you for your payment!

Best regards,
The Ogera Team`;
    const html = `
  <div style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
      <h2 style="color: #4CAF50; text-align: center;">Payment Confirmed</h2>
      <p style="color: #555; font-size: 16px;">
        Hello ${customerName},
      </p>
      <p style="color: #555; font-size: 16px;">
        Your payment has been successfully processed.
      </p>
      <div style="background: #e8f5e9; border-left: 4px solid #4CAF50; padding: 20px; margin: 20px 0; border-radius: 4px;">
        <p style="color: #333; font-size: 16px; margin: 10px 0;">
          <strong>Transaction ID:</strong> ${transactionId}
        </p>
        <p style="color: #333; font-size: 16px; margin: 10px 0;">
          <strong>Amount:</strong> $${amount.toFixed(2)}
        </p>
        <p style="color: #333; font-size: 16px; margin: 10px 0;">
          <strong>Payment Method:</strong> ${paymentMethod}
        </p>
        <p style="color: #333; font-size: 16px; margin: 10px 0;">
          <strong>Payment Date:</strong> ${paymentDateText}
        </p>
        ${description
        ? `<p style="color: #333; font-size: 16px; margin: 10px 0;"><strong>Description:</strong> ${description}</p>`
        : ''}
      </div>
      <br/>
      <p style="color: #333; font-size: 16px;">
        Thank you for your payment!<br/>
        Best regards,<br/>The <b>Ogera Team</b>
      </p>
    </div>
  </div>
  `;
    return { text, html };
};
exports.PaymentConfirmationTemplate = PaymentConfirmationTemplate;
// Subscription Confirmation Template
const SubscriptionConfirmationTemplate = (customerName, planName, billingCycle, amount, startDate, endDate) => {
    const startDateText = startDate.toLocaleString('en-US', {
        dateStyle: 'long',
    });
    const endDateText = endDate.toLocaleString('en-US', {
        dateStyle: 'long',
    });
    const text = `Hello ${customerName},

Your subscription has been confirmed!

Plan: ${planName}
Billing Cycle: ${billingCycle}
Amount: $${amount.toFixed(2)} per ${billingCycle === 'monthly' ? 'month' : 'year'}
Start Date: ${startDateText}
End Date: ${endDateText}

Thank you for subscribing to Ogera!

Best regards,
The Ogera Team`;
    const html = `
  <div style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
      <h2 style="color: #7f56d9; text-align: center;">Subscription Confirmed</h2>
      <p style="color: #555; font-size: 16px;">
        Hello ${customerName},
      </p>
      <p style="color: #555; font-size: 16px;">
        Your subscription has been confirmed!
      </p>
      <div style="background: #f3ebff; border-left: 4px solid #7f56d9; padding: 20px; margin: 20px 0; border-radius: 4px;">
        <p style="color: #333; font-size: 16px; margin: 10px 0;">
          <strong>Plan:</strong> ${planName}
        </p>
        <p style="color: #333; font-size: 16px; margin: 10px 0;">
          <strong>Billing Cycle:</strong> ${billingCycle.charAt(0).toUpperCase() + billingCycle.slice(1)}
        </p>
        <p style="color: #333; font-size: 16px; margin: 10px 0;">
          <strong>Amount:</strong> $${amount.toFixed(2)} per ${billingCycle === 'monthly' ? 'month' : 'year'}
        </p>
        <p style="color: #333; font-size: 16px; margin: 10px 0;">
          <strong>Start Date:</strong> ${startDateText}
        </p>
        <p style="color: #333; font-size: 16px; margin: 10px 0;">
          <strong>End Date:</strong> ${endDateText}
        </p>
      </div>
      <br/>
      <p style="color: #333; font-size: 16px;">
        Thank you for subscribing to Ogera!<br/>
        Best regards,<br/>The <b>Ogera Team</b>
      </p>
    </div>
  </div>
  `;
    return { text, html };
};
exports.SubscriptionConfirmationTemplate = SubscriptionConfirmationTemplate;
// Invoice Template
const InvoiceTemplate = (customerName, invoiceNumber, invoiceDate, dueDate, items, subtotal, tax, total, paymentStatus) => {
    const invoiceDateText = invoiceDate.toLocaleString('en-US', {
        dateStyle: 'long',
    });
    const dueDateText = dueDate.toLocaleString('en-US', {
        dateStyle: 'long',
    });
    const statusColor = paymentStatus === 'paid'
        ? '#4CAF50'
        : paymentStatus === 'overdue'
            ? '#f44336'
            : '#ff9800';
    const itemsList = items
        .map(item => `  - ${item.description} (Qty: ${item.quantity} @ $${item.unitPrice.toFixed(2)}) = $${(item.quantity * item.unitPrice).toFixed(2)}`)
        .join('\n');
    const text = `Invoice

Invoice Number: ${invoiceNumber}
Invoice Date: ${invoiceDateText}
Due Date: ${dueDateText}
Payment Status: ${paymentStatus.toUpperCase()}

Bill To:
${customerName}

Items:
${itemsList}

Subtotal: $${subtotal.toFixed(2)}
${tax ? `Tax: $${tax.toFixed(2)}` : ''}
Total: $${total.toFixed(2)}

${paymentStatus === 'paid'
        ? 'This invoice has been paid. Thank you!'
        : `Payment is ${paymentStatus}. Please pay by ${dueDateText}.`}

Thank you,
The Ogera Team`;
    const itemsHtml = items
        .map(item => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.description}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.unitPrice.toFixed(2)}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${(item.quantity * item.unitPrice).toFixed(2)}</td>
        </tr>`)
        .join('');
    const html = `
  <div style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
      <h2 style="color: #333; text-align: center;">Invoice</h2>
      <div style="display: flex; justify-content: space-between; margin: 20px 0;">
        <div>
          <p style="color: #555; font-size: 14px; margin: 5px 0;"><strong>Invoice Number:</strong> ${invoiceNumber}</p>
          <p style="color: #555; font-size: 14px; margin: 5px 0;"><strong>Invoice Date:</strong> ${invoiceDateText}</p>
          <p style="color: #555; font-size: 14px; margin: 5px 0;"><strong>Due Date:</strong> ${dueDateText}</p>
        </div>
        <div style="text-align: right;">
          <span style="display: inline-block; padding: 5px 15px; background: ${statusColor}; color: white; border-radius: 4px; font-weight: bold; font-size: 12px;">
            ${paymentStatus.toUpperCase()}
          </span>
        </div>
      </div>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="color: #333; font-size: 16px; margin: 5px 0;"><strong>Bill To:</strong></p>
        <p style="color: #555; font-size: 14px; margin: 5px 0;">${customerName}</p>
      </div>
      <h3 style="color: #333; margin-top: 30px;">Items</h3>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background: #f5f5f5;">
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Description</th>
            <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Quantity</th>
            <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Unit Price</th>
            <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold; border-top: 2px solid #ddd;">Subtotal:</td>
            <td style="padding: 10px; text-align: right; font-weight: bold; border-top: 2px solid #ddd;">$${subtotal.toFixed(2)}</td>
          </tr>
          ${tax
        ? `<tr><td colspan="3" style="padding: 10px; text-align: right;">Tax:</td><td style="padding: 10px; text-align: right;">$${tax.toFixed(2)}</td></tr>`
        : ''}
          <tr>
            <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold; font-size: 18px; border-top: 2px solid #ddd;">Total:</td>
            <td style="padding: 10px; text-align: right; font-weight: bold; font-size: 18px; border-top: 2px solid #ddd;">$${total.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
      <div style="background: ${paymentStatus === 'paid' ? '#e8f5e9' : '#fff3cd'}; border-left: 4px solid ${statusColor}; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="color: ${paymentStatus === 'paid' ? '#2e7d32' : '#856404'}; font-size: 14px; margin: 0;">
          ${paymentStatus === 'paid'
        ? '✅ This invoice has been paid. Thank you!'
        : `⚠️ Payment is ${paymentStatus}. Please pay by ${dueDateText}.`}
        </p>
      </div>
      <br/>
      <p style="color: #333; font-size: 16px;">
        Thank you,<br/>The <b>Ogera Team</b>
      </p>
    </div>
  </div>
  `;
    return { text, html };
};
exports.InvoiceTemplate = InvoiceTemplate;
