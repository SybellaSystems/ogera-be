import { SessionRepository } from './session.repo';
import { SessionAttributes } from '@/database/models/session.model';
import * as uaParser from 'ua-parser-js';

const UAParser = uaParser.UAParser || uaParser;

/**
 * Parse device type from user agent string
 */
export const parseDeviceType = (userAgent?: string): string => {
    if (!userAgent) return 'Desktop';

    const parser = new (UAParser as any)(userAgent);
    const device = parser.getDevice();

    if (device.type === 'mobile') return 'Mobile';
    if (device.type === 'tablet') return 'Tablet';
    return 'Desktop';
};

export class SessionService {
    private repo = new SessionRepository();

    /**
     * Create a new session
     */
    async createSession(data: {
        userId: string;
        token: string;
        userAgent?: string;
        ipAddress?: string;
        expiresAt: Date;
    }) {
        try {
            const deviceType = parseDeviceType(data.userAgent);

            const session = await this.repo.createSession({
                user_id: data.userId,
                token: data.token,
                device_type: deviceType,
                user_agent: data.userAgent,
                ip_address: data.ipAddress,
                expires_at: data.expiresAt,
            });

            return this.formatSession(session);
        } catch (error) {
            throw new Error(
                `Failed to create session: ${(error as any).message}`,
            );
        }
    }

    /**
     * Get all active sessions for a user
     */
    async getActiveSessionsByUserId(userId: string) {
        try {
            const sessions = await this.repo.getActiveSessionsByUserId(userId);

            if (!sessions || sessions.length === 0) {
                return [];
            }

            return sessions.map(session => this.formatSession(session));
        } catch (error) {
            console.error('Error fetching sessions:', error);
            // Return empty array if error occurs
            return [];
        }
    }

    /**
     * Format session data for API response
     */
    private formatSession(session: any) {
        return {
            id: session.id,
            device_type: session.device_type,
            user_agent: session.user_agent,
            ip_address: session.ip_address,
            last_activity: session.last_activity,
            created_at: session.created_at,
            expires_at: session.expires_at,
        };
    }

    /**
     * Update last activity
     */
    async updateLastActivity(sessionId: string) {
        try {
            await this.repo.updateLastActivity(sessionId);
        } catch (error) {
            throw new Error(
                `Failed to update activity: ${(error as any).message}`,
            );
        }
    }

    /**
     * Revoke a specific session
     */
    async revokeSession(sessionId: string) {
        try {
            const result = await this.repo.revokeSession(sessionId);
            if (result === 0) throw new Error('Session not found');
            return result;
        } catch (error) {
            throw new Error(
                `Failed to revoke session: ${(error as any).message}`,
            );
        }
    }

    /**
     * Revoke all sessions for a user
     */
    async revokeAllSessions(userId: string) {
        try {
            const result = await this.repo.revokeAllSessionsByUserId(userId);
            return result;
        } catch (error) {
            throw new Error(
                `Failed to revoke all sessions: ${(error as any).message}`,
            );
        }
    }

    /**
     * Revoke all sessions except the current one
     */
    async revokeOtherSessions(userId: string, currentSessionId: string) {
        try {
            const result = await this.repo.revokeOtherSessions(
                userId,
                currentSessionId,
            );
            return result;
        } catch (error) {
            throw new Error(
                `Failed to revoke other sessions: ${(error as any).message}`,
            );
        }
    }

    /**
     * Clean up expired sessions
     */
    async cleanupExpiredSessions() {
        try {
            const result = await this.repo.deleteExpiredSessions();
            return result;
        } catch (error) {
            throw new Error(
                `Failed to cleanup expired sessions: ${(error as any).message}`,
            );
        }
    }
}
