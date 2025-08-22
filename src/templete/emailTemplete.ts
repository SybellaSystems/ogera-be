export const EmailTemplete = (otp: string, expiry: Date) => {
  const expiryText = expiry.toLocaleString("en-US", {
    dateStyle: "full",
    timeStyle: "short",
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
