import { EMAIL_SCHEDULER_CONFIG } from '@/config';
import {
    processExpiredSubscriptions,
    sendSubscriptionExpiryReminders,
} from '@/modules/badge/badge.service';
import logger from '@/utils/logger';

let intervalHandle: ReturnType<typeof setInterval> | null = null;

export async function runBadgeSubscriptionMaintenance(): Promise<void> {
    try {
        const expired = await processExpiredSubscriptions();
        const reminders = await sendSubscriptionExpiryReminders();
        logger.info('Badge subscription maintenance completed', { expired, reminders });
    } catch (error) {
        logger.error('Badge subscription maintenance failed', error);
    }
}

export function startBadgeSubscriptionScheduler(): void {
    if (process.env.BADGE_SCHEDULER_ENABLED === 'false') {
        logger.info('Badge subscription scheduler disabled');
        return;
    }

    const intervalMs = parseInt(
        process.env.BADGE_SCHEDULER_INTERVAL_MS || String(24 * 60 * 60 * 1000),
        10,
    );

    if (intervalHandle) {
        clearInterval(intervalHandle);
    }

    intervalHandle = setInterval(() => {
        runBadgeSubscriptionMaintenance().catch((err) =>
            logger.error('Badge scheduler cycle error', err),
        );
    }, intervalMs);

    if (EMAIL_SCHEDULER_CONFIG.runOnStart) {
        runBadgeSubscriptionMaintenance().catch((err) =>
            logger.error('Badge scheduler initial run error', err),
        );
    }

    logger.info(`Badge subscription scheduler started (every ${intervalMs}ms)`);
}
