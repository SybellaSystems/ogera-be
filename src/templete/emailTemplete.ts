/** Escape text for safe HTML email interpolation. */
const esc = (raw: string | number | null | undefined) =>
    String(raw ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

// Footer CTA: all onboarding + list emails should end with an app redirect button.
const APP_ROOT_URL = "https://app.ogera.sybellasystems.co.rw";
const renderAppFooterHtml = () => `
  <div style="margin-top:22px;padding:16px 18px;background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;">
    <p style="margin:0 0 10px;font-size:13px;color:#475569;line-height:1.5;">
      Ready to continue? Open Ogera and explore your next step.
    </p>
    <a href="${esc(APP_ROOT_URL)}"
      style="display:inline-block;padding:13px 22px;background:#7c3aed;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;">
      Open Ogera App
    </a>
  </div>
`;

export const EmailTemplete = (otp: string, expiry: Date) => {
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

export const EmailVerificationTemplate = (
    verificationLink: string,
    expiry: Date,
) => {
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

export const JobApplicationStatusTemplate = (
    jobTitle: string,
    status: 'Accepted' | 'Rejected',
    studentName: string,
) => {
    const statusColor = status === 'Accepted' ? '#4CAF50' : '#f44336';
    const statusMessage =
        status === 'Accepted'
            ? 'Congratulations! Your application has been accepted.'
            : 'We regret to inform you that your application has been rejected.';

    const text = `Hello ${studentName},

${statusMessage}

Job Title: ${jobTitle}
Status: ${status}

${
    status === 'Accepted'
        ? 'The employer will contact you soon with further details.'
        : 'We encourage you to apply for other opportunities that match your skills.'
}

Thank you for your interest,
The Ogera Team

Open Ogera App: ${APP_ROOT_URL}`;

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
      ${
          status === 'Accepted'
              ? '<p style="color: #555; font-size: 16px;">The employer will contact you soon with further details.</p>'
              : '<p style="color: #555; font-size: 16px;">We encourage you to apply for other opportunities that match your skills.</p>'
      }
      <br/>
      <p style="color: #333; font-size: 16px;">
        Thank you for your interest,<br/>The <b>Ogera Team</b>
      </p>
      ${renderAppFooterHtml()}
    </div>
  </div>
  `;

    return { text, html };
};

export type WelcomeEmailRoleType =
    | 'student'
    | 'employer'
    | 'admin'
    | 'superAdmin'
    | string;

export interface WelcomeEmailTemplateOptions {
    roleType?: WelcomeEmailRoleType;
    /** Base URL of the web app (no trailing slash), e.g. https://app.example.com */
    frontendBaseUrl?: string;
}

// Welcome Email Template — rich onboarding with clear next steps and CTAs
export const WelcomeEmailTemplate = (
    userName: string,
    options?: WelcomeEmailTemplateOptions,
) => {
    const safeName = esc(userName);
    const base = (options?.frontendBaseUrl || 'http://localhost:5173').replace(
        /\/$/,
        '',
    );
    const role = String(options?.roleType || 'student').toLowerCase();
    const isStudent = role === 'student';
    const isEmployer = role === 'employer';
    const isAdminLike =
        role === 'admin' ||
        role === 'superadmin' ||
        role.includes('admin');

    const primaryCtaHref = isStudent
        ? `${base}/dashboard/jobs/all`
        : isEmployer
        ? `${base}/dashboard/jobs/unfunded`
        : `${base}/dashboard`;
    const primaryCtaLabel = isStudent
        ? 'Explore open roles'
        : isEmployer
        ? 'Go to your jobs'
        : 'Open dashboard';

    const secondaryCtaHref = isStudent
        ? `${base}/dashboard/tasks`
        : isEmployer
        ? `${base}/dashboard/jobs/all`
        : `${base}/dashboard`;
    const secondaryCtaLabel = isStudent
        ? 'My tasks'
        : isEmployer
        ? 'Manage job posts'
        : 'Notifications';

    let roleBulletsText: string;
    let roleBulletsHtml: string;
    if (isStudent) {
        roleBulletsText = [
            '- Complete your profile and academic verification to stand out',
            '- Browse curated roles and apply in a few clicks',
            '- Track applications and collaborate on tasks in one place',
            '- Build your trust score as you deliver great work',
        ].join('\n');
        roleBulletsHtml = `
        <ul style="margin:0;padding-left:20px;color:#334155;font-size:15px;line-height:1.65;">
          <li>Complete your profile and academic verification to stand out.</li>
          <li>Browse curated roles and apply in a few clicks.</li>
          <li>Track applications and collaborate on tasks in one place.</li>
          <li>Build your trust score as you deliver great work.</li>
        </ul>`;
    } else if (isEmployer) {
        roleBulletsText = [
            '- Publish roles and reach motivated student talent',
            '- Fund jobs via your Ogera wallet (MTN MoMo) so work can start smoothly',
            '- Review applications, assign tasks, and pay with confidence',
        ].join('\n');
        roleBulletsHtml = `
        <ul style="margin:0;padding-left:20px;color:#334155;font-size:15px;line-height:1.65;">
          <li>Publish roles and reach motivated student talent.</li>
          <li>Fund jobs via your Ogera wallet (MTN MoMo) so work can start smoothly.</li>
          <li>Review applications, assign tasks, and pay with confidence.</li>
        </ul>`;
    } else if (isAdminLike) {
        roleBulletsText = [
            '- Review platform activity and keep quality high',
            '- Publish jobs after review so students see trusted listings',
            '- Reach users through official notifications when needed',
        ].join('\n');
        roleBulletsHtml = `
        <ul style="margin:0;padding-left:20px;color:#334155;font-size:15px;line-height:1.65;">
          <li>Review platform activity and keep quality high.</li>
          <li>Publish jobs after review so students see trusted listings.</li>
          <li>Reach users through official notifications when needed.</li>
        </ul>`;
    } else {
        roleBulletsText = [
            '- Explore the dashboard tailored to your role',
            '- Complete any pending verification steps',
            '- Reach out if you need help getting started',
        ].join('\n');
        roleBulletsHtml = `
        <ul style="margin:0;padding-left:20px;color:#334155;font-size:15px;line-height:1.65;">
          <li>Explore the dashboard tailored to your role.</li>
          <li>Complete any pending verification steps.</li>
          <li>Reach out if you need help getting started.</li>
        </ul>`;
    }

    const text = `Welcome to Ogera 🚀

We’re excited to have you here and officially welcome you to the growing Ogera community, proudly built by Sybella Systems — a company committed to engineering Africa’s digital future.

Ogera is still in active development, which means you may notice:
* Features changing regularly
* New updates being released often
* Some things not yet fully polished
* Areas that may feel unclear or incomplete
And that’s okay. We are working every day to build the best possible platform for students, employers, and African talent.

Your early support means a lot because you are helping shape what Ogera becomes.
As we continue improving the platform, we encourage you to:
* Explore the system
* Test features
* Report bugs or issues
* Share ideas and feedback
* Invite your friends and classmates to join the movement

Your feedback is one of the most important parts of this journey.
Please also join our WhatsApp community group to stay updated, ask questions, share suggestions, and connect with other early users.

Thank you for believing in Ogera early. This is only the beginning, and we’re building it together. 💙

Open Ogera App: ${APP_ROOT_URL}`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f5f7ff;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f5f7ff;padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;box-shadow:0 10px 40px rgba(79,70,229,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 50%,#6d28d9 100%);padding:30px 26px 24px;">
              <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:.18em;color:rgba(255,255,255,0.9);text-transform:uppercase;">Ogera</p>
              <p style="margin:0;font-size:26px;font-weight:800;line-height:1.25;color:#ffffff;">Welcome to Ogera 🚀</p>
              <p style="margin:12px 0 0;font-size:14px;line-height:1.6;color:rgba(255,255,255,0.92);">Officially welcoming you to the growing Ogera community.</p>
            </td>
          </tr>

          <tr>
            <td style="padding:26px 26px 8px;">
              <p style="margin:0 0 16px;font-size:14px;line-height:1.8;color:#475569;">
                We’re excited to have you here and officially welcome you to the growing Ogera community, proudly built by Sybella Systems — a company committed to engineering Africa’s digital future.
              </p>

              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px 16px;margin:0 0 18px;">
                <p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:.1em;color:#64748b;text-transform:uppercase;">Ogera is still evolving</p>
                <p style="margin:0 0 12px;font-size:14px;line-height:1.65;color:#475569;">Ogera is still in active development, which means you may notice:</p>
                <ul style="margin:0;padding-left:18px;color:#334155;font-size:14px;line-height:1.7;">
                  <li>Features changing regularly</li>
                  <li>New updates being released often</li>
                  <li>Some things not yet fully polished</li>
                  <li>Areas that may feel unclear or incomplete</li>
                </ul>
                <p style="margin:12px 0 0;font-size:14px;line-height:1.65;color:#475569;">And that’s okay. We are working every day to build the best possible platform for students, employers, and African talent.</p>
              </div>

              <p style="margin:0 0 12px;font-size:14px;line-height:1.65;color:#475569;">
                Your early support means a lot because you are helping shape what Ogera becomes.
              </p>

              <p style="margin:0 0 10px;font-size:14px;font-weight:700;color:#0f172a;">As we continue improving the platform, we encourage you to:</p>
              <ul style="margin:0 0 18px;padding-left:18px;color:#334155;font-size:14px;line-height:1.7;">
                <li>Explore the system</li>
                <li>Test features</li>
                <li>Report bugs or issues</li>
                <li>Share ideas and feedback</li>
                <li>Invite your friends and classmates to join the movement</li>
              </ul>

              <div style="background:#eef2ff;border:1px solid #e0e7ff;border-radius:12px;padding:16px 14px;margin:0 0 18px;">
                <p style="margin:0;font-size:14px;line-height:1.65;color:#3730a3;">
                  Your feedback is one of the most important parts of this journey.
                  Please also join our WhatsApp community group to stay updated, ask questions, share suggestions, and connect with other early users.
                </p>
              </div>

              <p style="margin:0 0 12px;font-size:14px;line-height:1.65;color:#475569;">
                Thank you for believing in Ogera early. This is only the beginning, and we’re building it together. 💙
              </p>

              ${renderAppFooterHtml()}
            </td>
          </tr>

          <tr>
            <td style="padding:18px 26px 22px;background:#f8fafc;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">© ${new Date().getFullYear()} Ogera</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    return { text, html };
};

export interface DigestJobRow {
    job_id: string;
    job_title: string;
    location: string;
    category: string;
    budget: number;
    currency: string;
    duration: string;
    status: string;
    postedAt: Date;
}

/** Daily / periodic digest: active jobs for students */
export const ActiveJobsDigestEmailTemplate = (
    studentName: string,
    jobs: DigestJobRow[],
    browseJobsUrl: string,
) => {
    const safeName = esc(studentName);
    const when = new Date();
    const whenText = when.toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'short',
    });
    const listText = jobs
        .map(
            (j, i) =>
                `${i + 1}. ${j.job_title}\n   ${j.location} · ${j.category} · ${j.currency} ${j.budget} · ${j.duration}\n   Posted: ${j.postedAt.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}\n   ${browseJobsUrl.replace(/\/$/, '')}/dashboard/jobs/${j.job_id}`,
        )
        .join('\n\n');

    const text = `Hello ${studentName},

Here are open roles on Ogera right now (${jobs.length} listing${jobs.length === 1 ? '' : 's'}). This digest was prepared on ${whenText}.

${listText}

Browse all jobs: ${APP_ROOT_URL}

Good luck with your applications.

— The Ogera Team

Open Ogera App: ${APP_ROOT_URL}`;

    const rows =
        jobs.length === 0
            ? `<tr><td style="padding:20px;color:#64748b;font-size:14px;">No active listings matched this digest. Check back soon.</td></tr>`
            : jobs
                  .map(j => {
                      const posted = esc(
                          j.postedAt.toLocaleString('en-US', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                          }),
                      );
                      const detailUrl = `${esc(browseJobsUrl.replace(/\/$/, ''))}/dashboard/jobs/${esc(j.job_id)}`;
                      return `
            <tr>
              <td style="padding:14px 12px;border-bottom:1px solid #e2e8f0;vertical-align:top;">
                <p style="margin:0 0 6px;font-size:16px;font-weight:700;color:#0f172a;">${esc(j.job_title)}</p>
                <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#475569;">${esc(j.location)} · ${esc(j.category)}</p>
                <p style="margin:0 0 8px;font-size:13px;color:#334155;"><strong>${esc(j.currency)} ${esc(String(j.budget))}</strong> · ${esc(j.duration)} · <span style="color:#059669;">${esc(j.status)}</span></p>
                <p style="margin:0 0 10px;font-size:12px;color:#64748b;">Posted: ${posted}</p>
                <a href="${detailUrl}" style="display:inline-block;font-size:13px;font-weight:700;color:#5b21b6;text-decoration:none;">View job →</a>
              </td>
            </tr>`;
                  })
                  .join('');

    const html = `
<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 10px;background:#f1f5f9;">
    <tr><td align="center">
      <table role="presentation" width="600" style="max-width:600px;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e2e8f0;">
        <tr>
          <td style="background:linear-gradient(135deg,#0d9488,#059669);padding:26px 24px;">
            <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:.15em;color:rgba(255,255,255,0.85);text-transform:uppercase;">Jobs digest</p>
            <p style="margin:8px 0 0;font-size:22px;font-weight:800;color:#fff;line-height:1.25;">Open roles on Ogera</p>
            <p style="margin:10px 0 0;font-size:14px;color:rgba(255,255,255,0.92);">${esc(whenText)}</p>
          </td>
        </tr>
        <tr><td style="padding:22px 20px 8px;">
          <p style="margin:0 0 16px;font-size:16px;color:#0f172a;">Hi <strong>${safeName}</strong>,</p>
          <p style="margin:0 0 18px;font-size:14px;line-height:1.65;color:#475569;">Fresh opportunities students can apply for right now. Deadlines and details are on each job page.</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">${rows}</table>
          <table role="presentation" cellspacing="0" cellpadding="0" style="margin:22px 0 8px;"><tr>
            <td style="border-radius:10px;background:#0d9488;"><a href="${APP_ROOT_URL}" style="display:inline-block;padding:13px 22px;font-size:14px;font-weight:700;color:#fff;text-decoration:none;">Browse all jobs</a></td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:18px 20px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;">
          <p style="margin:0;font-size:12px;color:#94a3b8;">You receive this because you have a student account on Ogera. Listings reflect jobs that are currently active on the platform.</p>
        </td></tr>
        <tr>
          <td style="padding:14px 20px 24px;">
            ${renderAppFooterHtml()}
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

    return { text, html };
};

/** Employer: task created for an approved student */
export const TaskAssignedEmailTemplate = (
    studentName: string,
    jobTitle: string,
    taskTitle: string,
    deadline: Date | null,
    taskBoardUrl: string,
) => {
    const deadlineText = deadline
        ? deadline.toLocaleString('en-US', {
              dateStyle: 'full',
              timeStyle: 'short',
          })
        : 'No deadline set yet — check the task for details.';

    const text = `Hello ${studentName},

You have a new task assigned on Ogera.

Job: ${jobTitle}
Task: ${taskTitle}
Deadline: ${deadlineText}

Open your tasks: ${APP_ROOT_URL}

— The Ogera Team

Open Ogera App: ${APP_ROOT_URL}`;

    const html = `
<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#faf5ff;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 10px;">
    <tr><td align="center">
      <table role="presentation" width="600" style="max-width:600px;background:#fff;border-radius:14px;border:1px solid #e9d5ff;overflow:hidden;">
        <tr><td style="background:#7c3aed;padding:24px 22px;">
          <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:.12em;color:rgba(255,255,255,0.88);text-transform:uppercase;">New assignment</p>
          <p style="margin:8px 0 0;font-size:21px;font-weight:800;color:#fff;">A task is ready for you</p>
        </td></tr>
        <tr><td style="padding:24px 22px;">
          <p style="margin:0 0 14px;font-size:16px;color:#0f172a;">Hi <strong>${esc(studentName)}</strong>,</p>
          <p style="margin:0 0 18px;font-size:14px;line-height:1.65;color:#475569;">Your employer posted a task under a job you're approved for. Review the brief and start when you're ready.</p>
          <div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:12px;padding:18px 16px;margin:0 0 20px;">
            <p style="margin:0 0 8px;font-size:13px;color:#6b21a8;font-weight:700;text-transform:uppercase;letter-spacing:.06em;">Job</p>
            <p style="margin:0 0 14px;font-size:17px;font-weight:700;color:#1e1b4b;">${esc(jobTitle)}</p>
            <p style="margin:0 0 6px;font-size:13px;color:#6b21a8;font-weight:700;text-transform:uppercase;letter-spacing:.06em;">Task</p>
            <p style="margin:0 0 14px;font-size:16px;color:#312e81;">${esc(taskTitle)}</p>
            <p style="margin:0;font-size:13px;color:#475569;"><strong>Deadline:</strong> ${esc(deadlineText)}</p>
          </div>
          <table role="presentation" cellspacing="0" cellpadding="0"><tr>
            <td style="border-radius:10px;background:#7c3aed;"><a href="${APP_ROOT_URL}" style="display:inline-block;padding:13px 22px;font-size:14px;font-weight:700;color:#fff;text-decoration:none;">Open my tasks</a></td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:16px 22px 22px;background:#fafafa;border-top:1px solid #f3e8ff;">
          <p style="margin:0;font-size:12px;color:#94a3b8;">Questions? Reply via the job thread or contact support from your dashboard.</p>
        </td></tr>
        <tr>
          <td style="padding:0 22px 22px;">
            ${renderAppFooterHtml()}
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

    return { text, html };
};

export interface UnfundedJobReminderRow {
    job_id: string;
    job_title: string;
    status: string;
    funding_status: string | null;
}

/** Employer reminder: jobs not funded via MoMa / Ogera wallet */
export const JobNotFundedReminderEmailTemplate = (
    employerName: string,
    jobs: UnfundedJobReminderRow[],
    fundJobsUrl: string,
) => {
    const listText = jobs
        .map(
            (j, i) =>
                `${i + 1}. ${j.job_title} (status: ${j.status}, funding: ${j.funding_status || 'Unfunded'})`,
        )
        .join('\n');

    const text = `Hello ${employerName},

Some of your jobs on Ogera still need funding through your Ogera wallet (MTN MoMo) before students can be paid and work can progress smoothly.

Jobs needing attention:
${listText}

Fund or review jobs: ${APP_ROOT_URL}

— The Ogera Team

Open Ogera App: ${APP_ROOT_URL}`;

    const rows =
        jobs.length === 0
            ? ''
            : jobs
                  .map(
                      j => `
        <tr>
          <td style="padding:12px 10px;border-bottom:1px solid #fee2e2;">
            <p style="margin:0;font-size:15px;font-weight:700;color:#7f1d1d;">${esc(j.job_title)}</p>
            <p style="margin:6px 0 0;font-size:12px;color:#991b1b;">Status: ${esc(j.status)} · Funding: ${esc(j.funding_status || 'Unfunded')}</p>
          </td>
        </tr>`,
                  )
                  .join('');

    const html = `
<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#fff7ed;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 10px;">
    <tr><td align="center">
      <table role="presentation" width="600" style="max-width:600px;background:#fff;border-radius:14px;border:1px solid #fed7aa;overflow:hidden;">
        <tr><td style="background:linear-gradient(135deg,#ea580c,#f97316);padding:24px 22px;">
          <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:.12em;color:rgba(255,255,255,0.9);text-transform:uppercase;">Wallet & funding</p>
          <p style="margin:8px 0 0;font-size:21px;font-weight:800;color:#fff;">Fund your jobs on Ogera</p>
          <p style="margin:10px 0 0;font-size:14px;color:rgba(255,255,255,0.95);">Students rely on funded escrow so tasks and payouts stay fair and predictable.</p>
        </td></tr>
        <tr><td style="padding:24px 22px;">
          <p style="margin:0 0 14px;font-size:16px;color:#0f172a;">Hi <strong>${esc(employerName)}</strong>,</p>
          <p style="margin:0 0 18px;font-size:14px;line-height:1.65;color:#475569;">The following postings are not fully funded via your Ogera wallet (MTN MoMo). Complete funding so approved work can move forward without delays.</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#fff7ed;border-radius:10px;overflow:hidden;">${rows}</table>
          <table role="presentation" cellspacing="0" cellpadding="0" style="margin:22px 0 0;"><tr>
            <td style="border-radius:10px;background:#ea580c;"><a href="${APP_ROOT_URL}" style="display:inline-block;padding:13px 22px;font-size:14px;font-weight:700;color:#fff;text-decoration:none;">Review unfunded jobs</a></td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:16px 22px 22px;background:#fffbeb;border-top:1px solid #fde68a;">
          <p style="margin:0;font-size:12px;color:#92400e;">This is an automated reminder. If you already funded, refresh your dashboard — it can take a moment to sync.</p>
        </td></tr>
        <tr>
          <td style="padding:0 22px 22px;">
            ${renderAppFooterHtml()}
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

    return { text, html };
};

// Password Changed Template
export const PasswordChangedTemplate = (userName: string) => {
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

// Account Locked Template
export const AccountLockedTemplate = (userName: string) => {
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

// Account Unlocked Template
export const AccountUnlockedTemplate = (userName: string) => {
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

// Job Posted Template
export const JobPostedTemplate = (jobTitle: string, employerName: string) => {
    const text = `Hello ${employerName},

Your job posting has been successfully created and is now live on Ogera.

Job Title: ${jobTitle}

Students can now view and apply for this position. You will receive notifications when applications are submitted.

Thank you for using Ogera!

Best regards,
The Ogera Team

Open Ogera App: ${APP_ROOT_URL}`;

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
      ${renderAppFooterHtml()}
    </div>
  </div>
  `;

    return { text, html };
};

// Application Received Template
export const ApplicationReceivedTemplate = (
    jobTitle: string,
    studentName: string,
    employerName: string,
) => {
    const text = `Hello ${employerName},

You have received a new job application.

Job Title: ${jobTitle}
Applicant: ${studentName}

Please review the application in your dashboard.

Thank you,
The Ogera Team

Open Ogera App: ${APP_ROOT_URL}`;

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
      ${renderAppFooterHtml()}
    </div>
  </div>
  `;

    return { text, html };
};

// Academic Verification Status Template
export const AcademicVerificationStatusTemplate = (
    status: 'Approved' | 'Rejected',
    studentName: string,
    rejectionReason?: string,
) => {
    const statusColor = status === 'Approved' ? '#4CAF50' : '#f44336';
    const statusMessage =
        status === 'Approved'
            ? 'Congratulations! Your academic verification has been approved.'
            : 'We regret to inform you that your academic verification has been rejected.';

    const text = `Hello ${studentName},

${statusMessage}

Status: ${status}
${status === 'Rejected' && rejectionReason ? `Reason: ${rejectionReason}` : ''}

${
    status === 'Approved'
        ? 'You can now use this verification for your job applications.'
        : 'Please review the reason and resubmit if needed.'
}

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
        ${
            status === 'Rejected' && rejectionReason
                ? `
        <p style="color: #333; font-size: 16px; margin: 5px 0;">
          <strong>Reason:</strong> ${rejectionReason}
        </p>
        `
                : ''
        }
      </div>
      ${
          status === 'Approved'
              ? `
      <p style="color: #555; font-size: 16px;">
        You can now use this verification for your job applications.
      </p>
      `
              : `
      <p style="color: #555; font-size: 16px;">
        Please review the reason and resubmit if needed.
      </p>
      `
      }
      <br/>
      <p style="color: #333; font-size: 16px;">
        Thank you,<br/>The <b>Ogera Team</b>
      </p>
    </div>
  </div>
  `;

    return { text, html };
};

// Order Confirmation Template
export const OrderConfirmationTemplate = (
    orderNumber: string,
    customerName: string,
    items: Array<{ name: string; quantity: number; price: number }>,
    totalAmount: number,
    orderDate: Date,
) => {
    const orderDateText = orderDate.toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'short',
    });

    const itemsList = items
        .map(
            item =>
                `  - ${item.name} (Qty: ${
                    item.quantity
                }) - $${item.price.toFixed(2)}`,
        )
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
        .map(
            item => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${
              item.name
          }</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${
              item.quantity
          }</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.price.toFixed(
              2,
          )}</td>
        </tr>`,
        )
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
            <td style="padding: 10px; text-align: right; font-weight: bold; border-top: 2px solid #ddd;">$${totalAmount.toFixed(
                2,
            )}</td>
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

// Payment Confirmation Template
export const PaymentConfirmationTemplate = (
    customerName: string,
    transactionId: string,
    amount: number,
    paymentMethod: string,
    paymentDate: Date,
    description?: string,
) => {
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
        ${
            description
                ? `<p style="color: #333; font-size: 16px; margin: 10px 0;"><strong>Description:</strong> ${description}</p>`
                : ''
        }
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

// Subscription Confirmation Template
export const SubscriptionConfirmationTemplate = (
    customerName: string,
    planName: string,
    billingCycle: 'monthly' | 'yearly',
    amount: number,
    startDate: Date,
    endDate: Date,
) => {
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
Amount: $${amount.toFixed(2)} per ${
        billingCycle === 'monthly' ? 'month' : 'year'
    }
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
          <strong>Billing Cycle:</strong> ${
              billingCycle.charAt(0).toUpperCase() + billingCycle.slice(1)
          }
        </p>
        <p style="color: #333; font-size: 16px; margin: 10px 0;">
          <strong>Amount:</strong> $${amount.toFixed(2)} per ${
        billingCycle === 'monthly' ? 'month' : 'year'
    }
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

// Invoice Template
export const InvoiceTemplate = (
    customerName: string,
    invoiceNumber: string,
    invoiceDate: Date,
    dueDate: Date,
    items: Array<{ description: string; quantity: number; unitPrice: number }>,
    subtotal: number,
    tax: number | undefined,
    total: number,
    paymentStatus: 'paid' | 'pending' | 'overdue',
) => {
    const invoiceDateText = invoiceDate.toLocaleString('en-US', {
        dateStyle: 'long',
    });
    const dueDateText = dueDate.toLocaleString('en-US', {
        dateStyle: 'long',
    });

    const statusColor =
        paymentStatus === 'paid'
            ? '#4CAF50'
            : paymentStatus === 'overdue'
            ? '#f44336'
            : '#ff9800';

    const itemsList = items
        .map(
            item =>
                `  - ${item.description} (Qty: ${
                    item.quantity
                } @ $${item.unitPrice.toFixed(2)}) = $${(
                    item.quantity * item.unitPrice
                ).toFixed(2)}`,
        )
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

${
    paymentStatus === 'paid'
        ? 'This invoice has been paid. Thank you!'
        : `Payment is ${paymentStatus}. Please pay by ${dueDateText}.`
}

Thank you,
The Ogera Team`;

    const itemsHtml = items
        .map(
            item => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${
              item.description
          }</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${
              item.quantity
          }</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.unitPrice.toFixed(
              2,
          )}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${(
              item.quantity * item.unitPrice
          ).toFixed(2)}</td>
        </tr>`,
        )
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
            <td style="padding: 10px; text-align: right; font-weight: bold; border-top: 2px solid #ddd;">$${subtotal.toFixed(
                2,
            )}</td>
          </tr>
          ${
              tax
                  ? `<tr><td colspan="3" style="padding: 10px; text-align: right;">Tax:</td><td style="padding: 10px; text-align: right;">$${tax.toFixed(
                        2,
                    )}</td></tr>`
                  : ''
          }
          <tr>
            <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold; font-size: 18px; border-top: 2px solid #ddd;">Total:</td>
            <td style="padding: 10px; text-align: right; font-weight: bold; font-size: 18px; border-top: 2px solid #ddd;">$${total.toFixed(
                2,
            )}</td>
          </tr>
        </tfoot>
      </table>
      <div style="background: ${
          paymentStatus === 'paid' ? '#e8f5e9' : '#fff3cd'
      }; border-left: 4px solid ${statusColor}; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="color: ${
            paymentStatus === 'paid' ? '#2e7d32' : '#856404'
        }; font-size: 14px; margin: 0;">
          ${
              paymentStatus === 'paid'
                  ? '✅ This invoice has been paid. Thank you!'
                  : `⚠️ Payment is ${paymentStatus}. Please pay by ${dueDateText}.`
          }
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

/** Escape dynamic content injected into broadcast HTML emails. */
const escapeAdminBroadcastHtml = (raw: string) =>
    String(raw ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

export interface AdminBroadcastNotificationParams {
    recipientName?: string | null;
    title: string;
    message: string;
    senderLabel: 'Admin' | 'SuperAdmin';
}

/**
 * HTML email for admin/superadmin platform broadcasts (table layout for consistent client rendering).
 */
export const AdminBroadcastNotificationTemplate = (
    params: AdminBroadcastNotificationParams,
): { html: string; text: string } => {
    const { recipientName, title, message, senderLabel } = params;
    const safeTitle = escapeAdminBroadcastHtml(title);
    const safeMessage = escapeAdminBroadcastHtml(message).replace(/\n/g, '<br />');
    const safeSender = escapeAdminBroadcastHtml(senderLabel);
    const greeting = recipientName?.trim()
        ? `Hello ${escapeAdminBroadcastHtml(recipientName.trim())},`
        : 'Hello,';

    const text = [
        'Ogera — Important notification',
        '',
        recipientName?.trim() ? `Hello ${recipientName.trim()},` : 'Hello,',
        '',
        `Title: ${title}`,
        '',
        message,
        '',
        `Sent by platform ${senderLabel}`,
        '',
        '—',
        'You received this because an administrator sent a message through the Ogera platform.',
        '',
        'Best regards,',
        'The Ogera Team',
    ].join('\n');

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeTitle}</title>
</head>
<body style="margin:0;padding:0;background:#e8ecf1;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#e8ecf1;padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(15,23,42,0.12);border:1px solid #e2e8f0;">
          <tr>
            <td style="background:linear-gradient(135deg,#5b21b6 0%,#7c3aed 45%,#6d28d9 100%);padding:28px 32px 24px;text-align:left;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td valign="middle">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:.2em;color:rgba(255,255,255,0.85);text-transform:uppercase;">Ogera</p>
                    <p style="margin:0;font-size:22px;font-weight:800;line-height:1.25;color:#ffffff;">Important update</p>
                  </td>
                  <td width="96" valign="middle" align="right">
                    <span style="display:inline-block;padding:6px 12px;background:rgba(255,255,255,0.22);border-radius:999px;font-size:12px;font-weight:700;color:#ffffff;">Official</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 32px 8px;">
              <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#334155;">${greeting}</p>
              <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:.12em;color:#64748b;text-transform:uppercase;">Title</p>
              <h1 style="margin:0 0 22px;font-size:26px;line-height:1.3;color:#0f172a;font-weight:800;">${safeTitle}</h1>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
                <tr>
                  <td style="height:1px;background:linear-gradient(90deg,#7c3aed,#a78bfa);border-radius:1px;line-height:1px;font-size:1px;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 28px;">
              <p style="margin:0 0 12px;font-size:13px;color:#475569;line-height:1.5;"><strong style="color:#64748b;">Sent by:</strong> <span style="color:#334155;font-weight:600;">${safeSender}</span></p>
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:22px 20px;">
                <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.08em;">Message</p>
                <div style="margin:0;font-size:15px;line-height:1.75;color:#1e293b;">${safeMessage}</div>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:22px 32px 28px;background:#f1f5f9;border-top:1px solid #e2e8f0;">
              <p style="margin:0 0 14px;font-size:13px;line-height:1.65;color:#475569;">
                You are receiving this because an administrator broadcast this notice on <strong>Ogera</strong>. Sign in to your dashboard for the full notification center.
              </p>
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.5;">
                © ${new Date().getFullYear()} Ogera. This email was sent automatically; do not share passwords or OTPs by email.
              </p>
            </td>
          </tr>
        </table>
        <p style="margin:20px 0 0;font-size:11px;color:#94a3b8;text-align:center;max-width:560px;line-height:1.5;">
          If this message looks unexpected, contact your Ogera administrator.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`;

    return { html, text };
};

export interface MessageNotificationTemplateParams {
    recipientName: string;
    senderName: string;
    preview: string;
    openChatUrl: string;
    jobTitle?: string;
}

const escapeHtml = (raw: string) =>
    String(raw ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

export const MessageNotificationTemplate = (
    params: MessageNotificationTemplateParams,
): { html: string; text: string } => {
    const recipientName = escapeHtml(params.recipientName);
    const senderName = escapeHtml(params.senderName);
    const preview = escapeHtml(params.preview);
    const openChatUrl = escapeHtml(params.openChatUrl);
    const jobTitle = params.jobTitle ? escapeHtml(params.jobTitle) : null;

    const text = [
        `Hello ${params.recipientName},`,
        '',
        `${params.senderName} sent you a new message on Ogera.`,
        jobTitle ? `Job: ${params.jobTitle}` : null,
        '',
        `Preview: ${params.preview}`,
        '',
        `Open chat: ${params.openChatUrl}`,
        '',
        'Best regards,',
        'The Ogera Team',
    ]
        .filter(Boolean)
        .join('\n');

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>New message on Ogera</title>
</head>
<body style="margin:0;padding:0;background:#eef2ff;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="padding:24px 12px;background:#eef2ff;">
    <tr>
      <td align="center">
        <table role="presentation" width="620" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 18px 40px rgba(79,70,229,0.14);">
          <tr>
            <td style="padding:28px 32px;background:linear-gradient(135deg,#1d4ed8 0%,#4f46e5 55%,#7c3aed 100%);">
              <p style="margin:0 0 8px;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,0.82);font-weight:700;">Ogera Messages</p>
              <h1 style="margin:0;font-size:28px;line-height:1.2;color:#ffffff;">You have a new message</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 14px;font-size:16px;line-height:1.7;color:#334155;">Hello ${recipientName},</p>
              <p style="margin:0 0 18px;font-size:16px;line-height:1.7;color:#334155;">
                <strong style="color:#0f172a;">${senderName}</strong> sent you a new message on Ogera.
              </p>
              ${
                  jobTitle
                      ? `<p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#6366f1;"><strong>Conversation:</strong> ${jobTitle}</p>`
                      : ''
              }
              <div style="padding:20px 22px;border-radius:16px;background:#f8fafc;border:1px solid #e2e8f0;">
                <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#64748b;">Message preview</p>
                <p style="margin:0;font-size:15px;line-height:1.75;color:#0f172a;">${preview}</p>
              </div>
              <div style="padding-top:28px;">
                <a href="${openChatUrl}" style="display:inline-block;padding:14px 24px;border-radius:999px;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;">
                  Open Chat
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:22px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:#64748b;">
                You received this email because a new message arrived in a conversation you are not currently viewing.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

    return { html, text };
};
