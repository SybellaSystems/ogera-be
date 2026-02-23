import { Server as SocketIOServer } from 'socket.io';
import { verifyAccessToken } from '@/middlewares/jwt.service';
import { DB } from '@/database/index';
import logger from '@/utils/logger';
import { notifyCourseChatMessage } from '@/modules/notification/notification.service';

const COURSE_ROOM_PREFIX = 'course:';

/** Roles that can join any course chat (support side). */
const SUPPORT_ROLES = ['superadmin', 'admin', 'courseadmin', 'employer'];

function isSupportRole(role: string): boolean {
    return SUPPORT_ROLES.some(
        r => role?.toLowerCase() === r.toLowerCase(),
    );
}

export function setupCourseChatSocket(io: SocketIOServer): void {
    io.use(async (socket, next) => {
        try {
            const token =
                (socket.handshake.auth as { token?: string })?.token ||
                (socket.handshake.query?.token as string);
            if (!token) {
                return next(new Error('Authentication required'));
            }
            const decoded = verifyAccessToken(token);
            if (!decoded.user_id || !decoded.role) {
                return next(new Error('Invalid token'));
            }
            (socket.data as { user_id: string; role: string }).user_id =
                decoded.user_id as string;
            (socket.data as { user_id: string; role: string }).role =
                decoded.role as string;
            next();
        } catch (err) {
            next(new Error('Invalid or expired token'));
        }
    });

    io.on('connection', socket => {
        const user_id = (socket.data as { user_id: string }).user_id;
        const role = (socket.data as { role: string }).role;
        /** Already-joined course rooms for this socket (avoid repeated DB checks). */
        const joinedRooms = new Set<string>();

        socket.on(
            'course:join',
            async (
                payload: { courseId: string; conversationUserId?: string },
                callback,
            ) => {
                const courseId = payload?.courseId;
                if (!courseId) {
                    callback?.({ ok: false, message: 'courseId required' });
                    return;
                }
                try {
                    if (isSupportRole(role)) {
                        const room = COURSE_ROOM_PREFIX + courseId;
                        if (!joinedRooms.has(room)) {
                            socket.join(room);
                            joinedRooms.add(room);
                        }
                        const convUserId = payload?.conversationUserId;
                        if (convUserId) {
                            const threadRoom =
                                COURSE_ROOM_PREFIX + courseId + ':' + convUserId;
                            if (!joinedRooms.has(threadRoom)) {
                                socket.join(threadRoom);
                                joinedRooms.add(threadRoom);
                            }
                        }
                        callback?.({ ok: true });
                        return;
                    }
                    const enrollment = await DB.CourseEnrollments.findOne({
                        where: { course_id: courseId, user_id },
                    });
                    if (!enrollment) {
                        callback?.({
                            ok: false,
                            message: 'Enroll in the course to use chat',
                        });
                        return;
                    }
                    const room =
                        COURSE_ROOM_PREFIX + courseId + ':' + user_id;
                    if (!joinedRooms.has(room)) {
                        socket.join(room);
                        joinedRooms.add(room);
                    }
                    callback?.({ ok: true });
                } catch (err) {
                    logger.error('course:join error', err);
                    callback?.({ ok: false, message: 'Failed to join room' });
                }
            },
        );

        socket.on(
            'course:message',
            async (
                payload: {
                    courseId: string;
                    content: string;
                    replyToUserId?: string;
                },
                callback,
            ) => {
                const { courseId, content, replyToUserId } = payload || {};
                if (!courseId || typeof content !== 'string') {
                    callback?.({
                        ok: false,
                        message: 'courseId and content required',
                    });
                    return;
                }
                const trimmed = content.trim();
                if (!trimmed) {
                    callback?.({ ok: false, message: 'Content cannot be empty' });
                    return;
                }
                try {
                    let conversation_user_id: string;
                    if (isSupportRole(role)) {
                        if (!replyToUserId) {
                            callback?.({
                                ok: false,
                                message:
                                    'Support must specify replyToUserId (student)',
                            });
                            return;
                        }
                        conversation_user_id = replyToUserId;
                    } else {
                        const enrollment =
                            await DB.CourseEnrollments.findOne({
                                where: { course_id: courseId, user_id },
                            });
                        if (!enrollment) {
                            callback?.({
                                ok: false,
                                message: 'Enroll in the course to chat',
                            });
                            return;
                        }
                        conversation_user_id = user_id;
                    }
                    const message = await DB.CourseChatMessages.create({
                        course_id: courseId,
                        user_id,
                        role,
                        content: trimmed,
                        conversation_user_id,
                    });
                    const plain = message.get({ plain: true });
                    const studentRoom =
                        COURSE_ROOM_PREFIX + courseId + ':' + conversation_user_id;
                    io.to(studentRoom).emit('course:message', plain);
                    if (!isSupportRole(role)) {
                        io.to(COURSE_ROOM_PREFIX + courseId).emit(
                            'course:message',
                            plain,
                        );
                    }
                    try {
                        const course = await DB.Courses.findByPk(courseId, {
                            attributes: ['course_name'],
                        });
                        const course_name =
                            (course as any)?.course_name || 'Course';
                        await notifyCourseChatMessage(
                            courseId,
                            course_name,
                            user_id,
                            role,
                            trimmed,
                        );
                    } catch (notifyErr) {
                        logger.error('course chat notify error', notifyErr);
                    }
                    callback?.({ ok: true, message: plain });
                } catch (err) {
                    logger.error('course:message error', err);
                    callback?.({ ok: false, message: 'Failed to send message' });
                }
            },
        );

        socket.on('disconnect', () => {
            // rooms are left automatically
        });
    });
}
