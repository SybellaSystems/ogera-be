import { DB } from '@/database';
import { SessionAttributes } from '@/database/models/session.model';
import { Op } from 'sequelize';

export class SessionRepository {
    /**
     * Create a new session
     */
    async createSession(data: Partial<SessionAttributes>) {
        if (!data.user_id) throw new Error('user_id is required');
        if (!data.token) throw new Error('token is required');
        if (!data.expires_at) throw new Error('expires_at is required');

        try {
            console.log(
                '🔵 [Session Repo] Creating session for user:',
                data.user_id,
            );
            console.log('🔵 [Session Repo] Session data:', {
                user_id: data.user_id,
                device_type: data.device_type || 'Desktop',
                ip_address: data.ip_address,
                expires_at: data.expires_at,
            });

            const session = await DB.Sessions.create({
                user_id: data.user_id,
                token: data.token,
                device_type: data.device_type || 'Desktop',
                user_agent: data.user_agent || null,
                ip_address: data.ip_address || null,
                last_activity: new Date(),
                expires_at: data.expires_at,
            } as any);

            console.log(
                '✅ [Session Repo] Session created successfully:',
                session.id,
            );
            return session;
        } catch (error) {
            console.error('❌ [Session Repo] Failed to create session:', error);
            throw error;
        }
    }

    /**
     * Get all active sessions for a user
     */
    async getActiveSessionsByUserId(userId: string) {
        try {
            console.log(
                '🔵 [Session Repo] Fetching active sessions for user:',
                userId,
            );
            const sessions = await DB.Sessions.findAll({
                where: {
                    user_id: userId,
                    expires_at: {
                        [Op.gt]: new Date(),
                    },
                },
                order: [['last_activity', 'DESC']],
            });
            console.log(
                '✅ [Session Repo] Found',
                sessions.length,
                'active sessions',
            );
            return sessions;
        } catch (error) {
            console.error('❌ [Session Repo] Failed to fetch sessions:', error);
            throw error;
        }
    }

    /**
     * Find session by token
     */
    async getSessionByToken(token: string) {
        return DB.Sessions.findOne({
            where: { token },
        });
    }

    /**
     * Update last activity for a session
     */
    async updateLastActivity(sessionId: string) {
        return DB.Sessions.update(
            { last_activity: new Date() },
            { where: { id: sessionId } },
        );
    }

    /**
     * Revoke a specific session
     */
    async revokeSession(sessionId: string) {
        return DB.Sessions.destroy({
            where: { id: sessionId },
        });
    }

    /**
     * Revoke all sessions for a user
     */
    async revokeAllSessionsByUserId(userId: string) {
        return DB.Sessions.destroy({
            where: { user_id: userId },
        });
    }

    /**
     * Revoke all sessions except current
     */
    async revokeOtherSessions(userId: string, currentSessionId: string) {
        return DB.Sessions.destroy({
            where: {
                user_id: userId,
                id: {
                    [Op.ne]: currentSessionId,
                },
            },
        });
    }

    /**
     * Clean up expired sessions
     */
    async deleteExpiredSessions() {
        return DB.Sessions.destroy({
            where: {
                expires_at: {
                    [Op.lt]: new Date(),
                },
            },
        });
    }

    /**
     * Get session by ID
     */
    async getSessionById(sessionId: string) {
        return DB.Sessions.findByPk(sessionId);
    }

    /**
     * Count active sessions for a user
     */
    async countActiveSessions(userId: string) {
        return DB.Sessions.count({
            where: {
                user_id: userId,
                expires_at: {
                    [Op.gt]: new Date(),
                },
            },
        });
    }
}

export default new SessionRepository();
