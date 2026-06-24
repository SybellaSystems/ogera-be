import badgeConfig from '../../config/badgeConfig';
import { DB } from '../../database';
import { CustomError } from '../../utils/custom-error';
import { StatusCodes } from 'http-status-codes';
import { Op } from 'sequelize';
import { convertCurrency } from '@/utils/fx.service';
import {
    requestToPay,
    getTransactionStatus as getMoMoTransactionStatus,
    normalizePartyId,
    scheduleSandboxAutoSettle,
} from '@/modules/momo/momo.service';
import { createNotificationService } from '@/modules/notification/notification.service';
import { sendMail } from '@/utils/mailer';
import logger from '@/utils/logger';

export type BadgeType = 'FREE' | 'PREMIUM' | 'PIONEER';

const PREMIUM_PRICE = 1000;
const PREMIUM_DURATION_DAYS = 30;
const OGERA_WALLET_CURRENCY = (process.env.OGERA_WALLET_CURRENCY || 'USD')
    .trim()
    .toUpperCase();

export const getBadgeConfig = (badge: BadgeType) => {
    return badgeConfig[badge] || badgeConfig.FREE;
};

export const getEffectiveBadge = (user: {
    badge?: BadgeType | string | null;
    subscription_end_date?: Date | null;
}): BadgeType => {
    const badge = (user.badge || 'FREE') as BadgeType;
    if (badge === 'PREMIUM' && user.subscription_end_date) {
        if (new Date(user.subscription_end_date) < new Date()) {
            return 'FREE';
        }
    }
    return badge;
};

export const getSubscriptionDaysLeft = (user: {
    badge?: BadgeType | string | null;
    subscription_end_date?: Date | null;
}): number | null => {
    const badge = getEffectiveBadge(user);
    if (badge !== 'PREMIUM' || !user.subscription_end_date) return null;
    const end = new Date(user.subscription_end_date);
    const now = new Date();
    const diffMs = end.getTime() - now.getTime();
    if (diffMs <= 0) return 0;
    return Math.ceil(diffMs / (24 * 60 * 60 * 1000));
};

export const buildBadgeStatus = (user: any) => {
    const effectiveBadge = getEffectiveBadge(user);
    const config = getBadgeConfig(effectiveBadge);
    const daysLeft = getSubscriptionDaysLeft(user);

    return {
        badge: effectiveBadge,
        storedBadge: user.badge || 'FREE',
        pioneerEligible: Boolean(user.pioneer_eligible),
        badgeExpiryDate: user.badge_expiry_date || null,
        subscriptionStartDate: user.subscription_start_date || null,
        subscriptionEndDate: user.subscription_end_date || null,
        subscriptionDaysLeft: daysLeft,
        isPremiumActive: effectiveBadge === 'PREMIUM' && (daysLeft ?? 0) > 0,
        config,
    };
};

export const assignFreeBadgeOnRegistration = async (
    roleType: string,
): Promise<{ badge: BadgeType; pioneer_eligible: boolean } | null> => {
    if (roleType !== 'student') return null;

    return {
        badge: 'FREE',
        pioneer_eligible: true,
    };
};

export const getStudentApplicationCount = async (studentId: string): Promise<number> => {
    return DB.JobApplications.count({
        where: { student_id: studentId },
    });
};

export const assertCanApplyForJob = async (student: any): Promise<void> => {
    const effectiveBadge = getEffectiveBadge(student);
    const config = getBadgeConfig(effectiveBadge);
    const appliedCount = await getStudentApplicationCount(student.user_id);

    if (appliedCount >= config.applyLimit) {
        throw new CustomError(
            `Application limit reached. Your ${effectiveBadge} badge allows ${config.applyLimit} applications.`,
            StatusCodes.FORBIDDEN,
        );
    }
};

export const filterJobsForStudentBadge = (jobs: any[], badge: BadgeType): any[] => {
    const config = getBadgeConfig(badge);
    if (config.canSeeLatestJobs && !config.jobDelayDays) {
        return jobs;
    }

    const delayDays = config.jobDelayDays || 0;
    if (delayDays <= 0) return jobs;

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - delayDays);

    return jobs.filter((job) => {
        const createdAt = new Date(job.created_at || job.createdAt);
        return createdAt <= cutoff;
    });
};

export const checkAndAwardPioneerBadge = async (userId: string): Promise<boolean> => {
    const user = await DB.Users.findOne({ where: { user_id: userId } });
    if (!user || user.role_type !== 'student') return false;
    if (user.badge === 'PIONEER') return false;
    if (user.badge !== 'FREE') return false;

    const academicAccepted = await DB.AcademicVerifications.findOne({
        where: { user_id: userId, status: 'accepted' },
    });
    if (!academicAccepted) return false;

    // const completedTask = await DB.Tasks.findOne({
    //     where: { assigned_student_id: userId, status: 'COMPLETED' },
    // });
    // if (!completedTask) return false;

    await user.update({ badge: 'PIONEER' });

    try {
        await createNotificationService({
            user_id: userId,
            type: 'system',
            title: 'Pioneer Badge Unlocked!',
            message:
                'Congratulations! You completed academic verification and your first task. You are now a Pioneer student.',
            action_url: '/dashboard/profile',
        });
    } catch (err) {
        logger.warn('Failed to send pioneer notification', err);
    }

    return true;
};

export const initiatePremiumSubscription = async (
    userId: string,
    currency: string,
    payerPhone: string,
) => {
    const user = await DB.Users.findOne({ where: { user_id: userId } });
    if (!user || user.role_type !== 'student') {
        throw new CustomError('Only students can upgrade subscription', StatusCodes.FORBIDDEN);
    }

    if (user.badge === 'PIONEER') {
        throw new CustomError(
            'Pioneer students already have premium-level access',
            StatusCodes.BAD_REQUEST,
        );
    }

    const normalizedCurrency = String(currency || 'EUR').trim().toUpperCase();
    const amountStr = PREMIUM_PRICE.toFixed(0);

    const purchase = await DB.BadgePurchases.create({
        user_id: userId,
        from_badge: user.badge || 'FREE',
        to_badge: 'PREMIUM',
        amount: PREMIUM_PRICE,
        currency: normalizedCurrency,
        payment_status: 'PENDING',
    } as any);

    const { referenceId } = await requestToPay({
        amount: amountStr,
        currency: normalizedCurrency,
        externalId: purchase.id,
        payer: {
            partyIdType: 'MSISDN',
            partyId: normalizePartyId(payerPhone),
        },
        payerMessage: 'Ogera Premium Subscription',
        payeeNote: 'Premium badge upgrade (30 days)',
    });

    await purchase.update({ momo_reference_id: referenceId });

    scheduleSandboxAutoSettle(referenceId, {
        delayMs: 5000,
        isSettled: async () => {
            const row = await DB.BadgePurchases.findOne({
                where: { momo_reference_id: referenceId },
                attributes: ['payment_status'],
            });
            return row?.payment_status === 'SUCCESSFUL';
        },
        forceSettle: () => settleBadgeSubscription(referenceId),
    });

    return {
        referenceId,
        purchaseId: purchase.id,
        amount: PREMIUM_PRICE,
        currency: normalizedCurrency,
        durationDays: PREMIUM_DURATION_DAYS,
    };
};

export const settleBadgeSubscription = async (referenceId: string): Promise<boolean> => {
    const purchase = await DB.BadgePurchases.findOne({
        where: { momo_reference_id: referenceId },
    });
    if (!purchase || purchase.payment_status === 'SUCCESSFUL') {
        return false;
    }

    const user = await DB.Users.findOne({ where: { user_id: purchase.user_id } });
    if (!user) return false;

    const sourceCurrency = String(purchase.currency).toUpperCase();
    const sourceAmount = Number(purchase.amount) || PREMIUM_PRICE;

    let usdAmount = sourceAmount;
    let exchangeRate: number | null = 1;

    if (sourceCurrency !== OGERA_WALLET_CURRENCY) {
        try {
            const fx = await convertCurrency(sourceAmount, sourceCurrency, OGERA_WALLET_CURRENCY);
            usdAmount = fx.convertedAmount;
            exchangeRate = fx.rate;
        } catch (err) {
            logger.warn(
                `FX conversion failed for badge subscription ${referenceId}, using 1:1 fallback`,
                err,
            );
        }
    }

    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + PREMIUM_DURATION_DAYS);

    await purchase.update({
        payment_status: 'SUCCESSFUL',
        usd_amount: usdAmount,
        exchange_rate: exchangeRate,
        subscription_start_date: now,
        subscription_end_date: endDate,
    });

    if (user.badge !== 'PIONEER') {
        await user.update({
            badge: 'PREMIUM',
            subscription_start_date: now,
            subscription_end_date: endDate,
            badge_expiry_date: endDate,
        });
    }

    if (DB.Transactions) {
        const alreadyLogged = await DB.Transactions.findOne({
            where: { reference_id: referenceId, type: 'BADGE_SUBSCRIPTION_CREDIT' },
        });
        if (!alreadyLogged) {
            await DB.Transactions.create({
                user_id: user.user_id,
                amount: sourceAmount,
                currency: sourceCurrency,
                type: 'BADGE_SUBSCRIPTION_CREDIT',
                reference_id: referenceId,
                original_amount: sourceAmount,
                original_currency: sourceCurrency,
                converted_amount: usdAmount,
                converted_currency: OGERA_WALLET_CURRENCY,
                exchange_rate: exchangeRate,
                fx_timestamp: new Date(),
                metadata: {
                    stage: 'BADGE_SUBSCRIPTION',
                    from_badge: purchase.from_badge,
                    to_badge: purchase.to_badge,
                    purchase_id: purchase.id,
                },
                description: `Premium subscription payment (${sourceCurrency} → ${OGERA_WALLET_CURRENCY} wallet credit).`,
            } as any);
        }
    }

    try {
        await createNotificationService({
            user_id: user.user_id,
            type: 'system',
            title: 'Premium Subscription Active',
            message: `Your Premium badge is now active for ${PREMIUM_DURATION_DAYS} days.`,
            action_url: '/dashboard/profile',
        });
    } catch (err) {
        logger.warn('Failed to send premium activation notification', err);
    }

    return true;
};

export const pollBadgePaymentStatus = async (referenceId: string, userId: string) => {
    const purchase = await DB.BadgePurchases.findOne({
        where: { momo_reference_id: referenceId, user_id: userId },
    });
    if (!purchase) {
        throw new CustomError('Payment not found', StatusCodes.NOT_FOUND);
    }

    if (purchase.payment_status === 'SUCCESSFUL') {
        const user = await DB.Users.findOne({ where: { user_id: userId } });
        return {
            status: 'SUCCESSFUL',
            badge: buildBadgeStatus(user),
        };
    }

    let momoStatus: { status?: string } = { status: 'PENDING' };
    try {
        momoStatus = (await getMoMoTransactionStatus(referenceId)) as { status?: string };
    } catch (err) {
        logger.warn(`MoMo status check failed for badge payment ${referenceId}`, err);
    }

    await purchase.reload();
    const paymentStatus = String(purchase.payment_status);

    if (paymentStatus === 'SUCCESSFUL' || momoStatus?.status === 'SUCCESSFUL') {
        if (paymentStatus !== 'SUCCESSFUL') {
            await settleBadgeSubscription(referenceId);
            await purchase.reload();
        }
        const user = await DB.Users.findOne({ where: { user_id: userId } });
        return {
            status: 'SUCCESSFUL',
            badge: buildBadgeStatus(user),
        };
    }

    if (momoStatus?.status === 'FAILED') {
        await purchase.update({ payment_status: 'FAILED' });
    }

    return {
        status: momoStatus?.status || purchase.payment_status || 'PENDING',
        badge: null,
    };
};

export const getBadgeStatusService = async (userId: string) => {
    const user = await DB.Users.findOne({ where: { user_id: userId } });
    if (!user) {
        throw new CustomError('User not found', StatusCodes.NOT_FOUND);
    }

    const effectiveBadge = getEffectiveBadge(user);
    if (effectiveBadge === 'FREE' && user.badge === 'PREMIUM') {
        await user.update({
            badge: 'FREE',
            subscription_start_date: null,
            subscription_end_date: null,
            badge_expiry_date: null,
        });
    }

    const appliedCount = await getStudentApplicationCount(userId);
    const config = getBadgeConfig(getEffectiveBadge(user));

    return {
        ...buildBadgeStatus(user),
        applicationsUsed: appliedCount,
        applicationsRemaining: Math.max(0, config.applyLimit - appliedCount),
    };
};

export const getStudentPurchaseHistory = async (userId: string) => {
    return DB.BadgePurchases.findAll({
        where: { user_id: userId },
        order: [['created_at', 'DESC']],
    });
};

export const getAdminBadgePurchaseHistory = async (page = 1, limit = 20) => {
    const offset = (page - 1) * limit;
    const { rows, count } = await DB.BadgePurchases.findAndCountAll({
        include: [
            {
                model: DB.Users,
                as: 'user',
                attributes: ['user_id', 'full_name', 'email', 'mobile_number', 'badge'],
            },
        ],
        order: [['created_at', 'DESC']],
        limit,
        offset,
    });

    return {
        data: rows,
        pagination: {
            total: count,
            page,
            limit,
            totalPages: Math.ceil(count / limit),
        },
    };
};

export const getAdminBadgeStats = async () => {
    const [totalStudents, freeCount, premiumCount, pioneerCount] = await Promise.all([
        DB.Users.count({ where: { role_type: 'student' } }),
        DB.Users.count({ where: { role_type: 'student', badge: 'FREE' } }),
        DB.Users.count({ where: { role_type: 'student', badge: 'PREMIUM' } }),
        DB.Users.count({ where: { role_type: 'student', badge: 'PIONEER' } }),
    ]);

    return {
        totalStudents,
        freeBadgeStudents: freeCount,
        premiumStudents: premiumCount,
        pioneerStudents: pioneerCount,
    };
};

export const processExpiredSubscriptions = async (): Promise<number> => {
    const now = new Date();
    const expiredUsers = await DB.Users.findAll({
        where: {
            badge: 'PREMIUM',
            subscription_end_date: { [Op.lt]: now },
        },
    });

    for (const user of expiredUsers) {
        await user.update({
            badge: 'FREE',
            subscription_start_date: null,
            subscription_end_date: null,
            badge_expiry_date: null,
        });

        try {
            await createNotificationService({
                user_id: user.user_id,
                type: 'system',
                title: 'Premium Subscription Expired',
                message: 'Your Premium subscription has expired. Your badge is now FREE.',
                action_url: '/dashboard/profile',
            });
        } catch (err) {
            logger.warn('Failed to notify subscription expiry', err);
        }
    }

    return expiredUsers.length;
};

export const sendSubscriptionExpiryReminders = async (): Promise<number> => {
    const now = new Date();
    const inSevenDays = new Date(now);
    inSevenDays.setDate(inSevenDays.getDate() + 7);

    const startOfDay = new Date(inSevenDays);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(inSevenDays);
    endOfDay.setHours(23, 59, 59, 999);

    const users = await DB.Users.findAll({
        where: {
            badge: 'PREMIUM',
            subscription_end_date: {
                [Op.between]: [startOfDay, endOfDay],
            },
        },
    });

    let sent = 0;
    for (const user of users) {
        const daysLeft = getSubscriptionDaysLeft(user) ?? 7;
        const message = `Your Premium Subscription will expire in ${daysLeft} days.`;

        try {
            await createNotificationService({
                user_id: user.user_id,
                type: 'system',
                title: 'Premium Subscription Expiring Soon',
                message,
                action_url: '/dashboard/profile',
            });

            if (user.email) {
                await sendMail({
                    to: user.email,
                    subject: 'Your Ogera Premium Subscription is expiring soon',
                    text: message,
                    html: `<p>Hi ${user.full_name || 'there'},</p><p>${message}</p><p>Upgrade again from your profile to keep Premium access.</p>`,
                });
            }
            sent += 1;
        } catch (err) {
            logger.warn(`Failed to send expiry reminder to ${user.user_id}`, err);
        }
    }

    return sent;
};

export { PREMIUM_PRICE, PREMIUM_DURATION_DAYS };
