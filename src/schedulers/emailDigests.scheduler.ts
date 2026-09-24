import { Op } from 'sequelize';
import { DB } from '@/database';
import { EMAIL_SCHEDULER_CONFIG } from '@/config';
import {
    sendActiveJobsDigestEmail,
    sendJobNotFundedReminderEmail,
} from '@/services/email/email.service';
import type {
    DigestJobRow,
    UnfundedJobReminderRow,
} from '@/templete/emailTemplete';
import logger from '@/utils/logger';

const buildDigestRows = (jobs: any[]): DigestJobRow[] =>
    jobs.map(j => {
        const plain = typeof j.get === 'function' ? j.get({ plain: true }) : j;
        return {
            job_id: plain.job_id,
            job_title: plain.job_title,
            location: plain.location || '',
            category: plain.category || '',
            budget: Number(plain.budget) || 0,
            currency: plain.currency || 'USD',
            duration: plain.duration || '',
            status: plain.status || 'Active',
            postedAt: plain.updated_at
                ? new Date(plain.updated_at)
                : new Date(plain.created_at),
        };
    });

export async function runStudentActiveJobsDigest(): Promise<void> {
    const max = EMAIL_SCHEDULER_CONFIG.maxJobsPerDigest;
    const jobs = await DB.Jobs.findAll({
        where: { status: 'Active' },
        order: [
            ['updated_at', 'DESC'],
            ['created_at', 'DESC'],
        ],
        limit: max,
    });

    const digestJobs = buildDigestRows(jobs);

    if (digestJobs.length === 0) {
        logger.info('Skipping student jobs digest — no active listings');
        return;
    }

    const students = await DB.Users.findAll({
        where: {
            role_type: 'student',
            email: { [Op.ne]: '' },
        },
        attributes: ['email', 'full_name'],
    });

    let sent = 0;
    let failed = 0;

    for (const s of students) {
        const email = s.email?.trim();
        if (!email) continue;
        try {
            await sendActiveJobsDigestEmail(
                email,
                s.full_name?.trim() || 'there',
                digestJobs,
            );
            sent += 1;
        } catch (e) {
            failed += 1;
            logger.error('Student jobs digest email failed', {
                to: email,
                error: e instanceof Error ? e.message : String(e),
            });
        }
    }

    logger.info('Student active jobs digest completed', {
        listings: digestJobs.length,
        recipientsOk: sent,
        recipientsFailed: failed,
    });
}

export async function runEmployerUnfundedJobsReminder(): Promise<void> {
    const jobs = await DB.Jobs.findAll({
        // Sequelize typing: allow IS NULL for legacy rows without funding_status
        where: {
            status: { [Op.in]: ['Pending', 'Active'] },
            [Op.or]: [
                { funding_status: null },
                { funding_status: { [Op.in]: ['Unfunded', 'Pending'] } },
            ],
        } as any,
        attributes: [
            'job_id',
            'job_title',
            'status',
            'funding_status',
            'employer_id',
        ],
    });

    const byEmployer = new Map<string, UnfundedJobReminderRow[]>();
    for (const j of jobs) {
        const plain = typeof j.get === 'function' ? j.get({ plain: true }) : j;
        const eid = plain.employer_id as string;
        if (!eid) continue;
        const row: UnfundedJobReminderRow = {
            job_id: plain.job_id,
            job_title: plain.job_title,
            status: plain.status,
            funding_status: plain.funding_status ?? null,
        };
        const list = byEmployer.get(eid) || [];
        list.push(row);
        byEmployer.set(eid, list);
    }

    let sent = 0;
    let failed = 0;

    for (const [employerId, unfunded] of byEmployer) {
        const employer = await DB.Users.findOne({
            where: { user_id: employerId },
            attributes: ['email', 'full_name'],
        });
        const email = employer?.email?.trim();
        if (!email) continue;
        try {
            await sendJobNotFundedReminderEmail(
                email,
                employer?.full_name?.trim() || 'there',
                unfunded,
            );
            sent += 1;
        } catch (e) {
            failed += 1;
            logger.error('Employer unfunded jobs reminder failed', {
                to: email,
                error: e instanceof Error ? e.message : String(e),
            });
        }
    }

    logger.info('Employer unfunded jobs reminder completed', {
        employersEmailed: sent,
        failed,
        unfundedJobRows: jobs.length,
    });
}

async function runAllDigests(): Promise<void> {
    try {
        await runStudentActiveJobsDigest();
    } catch (e) {
        logger.error('runStudentActiveJobsDigest error', {
            error: e instanceof Error ? e.message : String(e),
        });
    }
    try {
        await runEmployerUnfundedJobsReminder();
    } catch (e) {
        logger.error('runEmployerUnfundedJobsReminder error', {
            error: e instanceof Error ? e.message : String(e),
        });
    }
}

/**
 * Starts daily email digests at configured time.
 * Disable with EMAIL_DIGEST_SCHEDULER_ENABLED=false
 */
export function startEmailDigestSchedulers(): void {
    if (!EMAIL_SCHEDULER_CONFIG.enabled) {
        logger.info(
            'Email digest scheduler disabled (EMAIL_DIGEST_SCHEDULER_ENABLED=false)',
        );
        return;
    }

    const scheduleNext = () => {
        const now = new Date();
        const next = new Date(now);
        next.setHours(
            EMAIL_SCHEDULER_CONFIG.dailyHour,
            EMAIL_SCHEDULER_CONFIG.dailyMinute,
            0,
            0,
        );

        // If the daily time already passed for today, schedule for tomorrow.
        if (next.getTime() <= now.getTime()) {
            next.setDate(next.getDate() + 1);
        }

        const delayMs = Math.max(0, next.getTime() - now.getTime());
        logger.info('Next email digest run scheduled', {
            at: next.toISOString(),
            delayMs,
        });

        setTimeout(async () => {
            try {
                await runAllDigests();
            } finally {
                scheduleNext();
            }
        }, delayMs);
    };

    if (EMAIL_SCHEDULER_CONFIG.runOnStart) {
        // One early run shortly after boot, then the daily schedule.
        setTimeout(() => {
            void runAllDigests().finally(() => scheduleNext());
        }, 15_000);
    } else {
        scheduleNext();
    }
}
