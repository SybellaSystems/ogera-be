import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { DB } from '@/database';
import logger from '@/utils/logger';

/**
 * POST /api/interviews
 * Body: { student_id, job_id, scheduled_at, notes? }
 * Schedules an interview between an employer (req.user) and a student.
 * Verifies the employer owns the job before creating the interview.
 */
export const scheduleInterview = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const employerId = req.user?.user_id;
        if (!employerId) {
            res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                status: StatusCodes.UNAUTHORIZED,
                message: 'Not authenticated',
            });
            return;
        }

        const { student_id, job_id, scheduled_at, notes } = req.body || {};

        if (!student_id || !scheduled_at) {
            res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                status: StatusCodes.BAD_REQUEST,
                message: 'student_id and scheduled_at are required',
            });
            return;
        }

        const when = new Date(scheduled_at);
        if (isNaN(when.getTime())) {
            res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                status: StatusCodes.BAD_REQUEST,
                message: 'scheduled_at is not a valid date',
            });
            return;
        }
        if (when.getTime() < Date.now()) {
            res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                status: StatusCodes.BAD_REQUEST,
                message: 'scheduled_at must be in the future',
            });
            return;
        }

        // If a job_id is provided, verify the employer actually owns it.
        // Without a job_id, this is a general "let's chat" interview from the worker profile page.
        let jobTitle = '';
        if (job_id) {
            const job: any = await DB.Jobs.findOne({
                where: { job_id, employer_id: employerId },
                attributes: ['job_id', 'job_title'],
            });
            if (!job) {
                res.status(StatusCodes.FORBIDDEN).json({
                    success: false,
                    status: StatusCodes.FORBIDDEN,
                    message:
                        'You can only schedule interviews for your own jobs',
                });
                return;
            }
            jobTitle = job.job_title;
        }

        // Look up employer name for the notification
        let employerName = 'An employer';
        try {
            const emp: any = await DB.Users.findOne({
                where: { user_id: employerId },
                attributes: ['full_name'],
            });
            if (emp?.full_name) employerName = emp.full_name;
        } catch {
            // best-effort
        }

        const interview: any = await DB.Interviews.create({
            student_id,
            employer_id: employerId,
            job_id: job_id || null,
            scheduled_at: when,
            status: 'scheduled',
            notes: notes?.trim() || null,
        } as any);

        // Best-effort: notify the student (don't block on failure)
        try {
            const message = jobTitle
                ? `You have an interview for "${jobTitle}" on ${when.toLocaleString()}`
                : `${employerName} invited you to an interview on ${when.toLocaleString()}`;
            await DB.Notifications.create({
                user_id: student_id,
                type: 'system',
                title: '📅 Interview scheduled',
                message,
                related_id: interview.id,
            } as any);
        } catch (e: any) {
            logger.error(
                '[Interview] Failed to create student notification:',
                e?.message || e,
            );
        }

        res.status(StatusCodes.CREATED).json({
            success: true,
            status: StatusCodes.CREATED,
            data: {
                id: interview.id,
                scheduled_at: interview.scheduled_at,
                status: interview.status,
            },
            message: 'Interview scheduled successfully',
        });
    } catch (error: any) {
        logger.error(
            '[Interview Controller] Error in scheduleInterview:',
            error,
        );
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            status: StatusCodes.INTERNAL_SERVER_ERROR,
            message: error?.message || 'Failed to schedule interview',
        });
    }
};

/**
 * GET /api/interviews/my
 * Returns interviews for the logged-in student, with job + employer info.
 * Sorted: upcoming first (by scheduled_at asc), then past (by scheduled_at desc).
 */
export const getMyInterviews = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const userId = req.user?.user_id;
        if (!userId) {
            res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                status: StatusCodes.UNAUTHORIZED,
                message: 'Not authenticated',
            });
            return;
        }

        const interviews: any[] = await DB.Interviews.findAll({
            where: { student_id: userId },
            include: [
                {
                    model: DB.Jobs,
                    as: 'job',
                    required: false,
                    attributes: [
                        'job_id',
                        'job_title',
                        'category',
                        'location',
                        'budget',
                    ],
                    include: [
                        {
                            model: DB.Users,
                            as: 'employer',
                            required: false,
                            attributes: [
                                'user_id',
                                'full_name',
                                'email',
                                'profile_image_url',
                            ],
                        },
                    ],
                },
            ],
            order: [['scheduled_at', 'ASC']],
        });

        const now = new Date();
        const upcoming: any[] = [];
        const past: any[] = [];

        for (const i of interviews) {
            const plain = i.get({ plain: true });
            const item = {
                id: plain.id,
                scheduled_at: plain.scheduled_at,
                status: plain.status,
                notes: plain.notes,
                job: plain.job
                    ? {
                          job_id: plain.job.job_id,
                          job_title: plain.job.job_title,
                          category: plain.job.category,
                          location: plain.job.location,
                          budget: plain.job.budget,
                          employer: plain.job.employer
                              ? {
                                    full_name: plain.job.employer.full_name,
                                    email: plain.job.employer.email,
                                    profile_image_url:
                                        plain.job.employer.profile_image_url,
                                }
                              : null,
                      }
                    : null,
            };

            const isPast =
                plain.status === 'completed' ||
                plain.status === 'cancelled' ||
                new Date(plain.scheduled_at) < now;

            if (isPast) past.push(item);
            else upcoming.push(item);
        }

        // Past should be most-recent-first
        past.sort(
            (a, b) =>
                new Date(b.scheduled_at).getTime() -
                new Date(a.scheduled_at).getTime(),
        );

        res.status(StatusCodes.OK).json({
            success: true,
            status: StatusCodes.OK,
            data: { upcoming, past, total: upcoming.length + past.length },
            message: 'Interviews retrieved successfully',
        });
    } catch (error: any) {
        logger.error('[Interview Controller] Error in getMyInterviews:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            status: StatusCodes.INTERNAL_SERVER_ERROR,
            message: error?.message || 'Failed to load interviews',
        });
    }
};
