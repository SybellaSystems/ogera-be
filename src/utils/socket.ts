import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { verify } from 'jsonwebtoken';
import { FRONTEND_URL, JWT_ACCESS_TOKEN_SECRET } from '@/config';
import { DB } from '@/database';
import logger from './logger';

let io: SocketIOServer | null = null;

const userSocketIds = new Map<string, Set<string>>();
const socketUserIds = new Map<string, string>();
const userConversationActivity = new Map<string, Set<string>>();
const userLastSeenAt = new Map<string, string>();

const getConversationRoom = (conversation_id: string) => `conversation:${conversation_id}`;

const addSocketForUser = (user_id: string, socket_id: string) => {
  const socketIds = userSocketIds.get(user_id) || new Set<string>();
  socketIds.add(socket_id);
  userSocketIds.set(user_id, socketIds);
  socketUserIds.set(socket_id, user_id);
};

const removeSocketForUser = (socket_id: string) => {
  const user_id = socketUserIds.get(socket_id);
  if (!user_id) return null;

  const socketIds = userSocketIds.get(user_id);
  socketIds?.delete(socket_id);
  if (!socketIds || socketIds.size === 0) {
    userSocketIds.delete(user_id);
    userLastSeenAt.set(user_id, new Date().toISOString());
  }

  socketUserIds.delete(socket_id);
  return user_id;
};

const addConversationActivity = (user_id: string, conversation_id: string) => {
  const activeConversations = userConversationActivity.get(user_id) || new Set<string>();
  activeConversations.add(conversation_id);
  userConversationActivity.set(user_id, activeConversations);
};

const removeConversationActivity = (user_id: string, conversation_id: string) => {
  const activeConversations = userConversationActivity.get(user_id);
  if (!activeConversations) return;

  activeConversations.delete(conversation_id);
  if (activeConversations.size === 0) {
    userConversationActivity.delete(user_id);
  }
};

const isUserOnline = (user_id: string) => (userSocketIds.get(user_id)?.size || 0) > 0;

export const isUserActiveInConversation = (user_id: string, conversation_id: string) =>
  userConversationActivity.get(user_id)?.has(conversation_id) || false;

export const getUserLastSeenAt = (user_id: string) => userLastSeenAt.get(user_id) || null;

const broadcastConversationPresence = (conversation_id: string, user_id: string) => {
  if (!io) return;

  io.to(getConversationRoom(conversation_id)).emit('conversation:presence', {
    conversation_id,
    user_id,
    is_online: isUserOnline(user_id),
    last_seen_at: getUserLastSeenAt(user_id),
  });
};

const verifyConversationAccess = async (conversation_id: string, user_id: string) => {
  const conversation = await DB.Conversations.findByPk(conversation_id);
  if (!conversation) {
    return { allowed: false, conversation: null };
  }

  const allowed =
    String(conversation.employer_id) === String(user_id) ||
    String(conversation.student_id) === String(user_id);

  return { allowed, conversation };
};

export const initializeSocket = (httpServer: HTTPServer) => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  io.use(async (socket: Socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded: any = verify(token, JWT_ACCESS_TOKEN_SECRET!);
      const user = await DB.Users.findOne({
        where: { user_id: decoded.user_id },
        include: [
          {
            model: DB.Roles,
            as: 'role',
            attributes: ['roleName', 'roleType'],
          },
        ],
      });

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      (socket as any).user_id = decoded.user_id;
      (socket as any).userRole = decoded.role;
      (socket as any).user = user;

      next();
    } catch (error: any) {
      logger.error('Socket authentication error:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user_id = (socket as any).user_id;
    const userRole = (socket as any).userRole;

    addSocketForUser(user_id, socket.id);
    logger.info(`Socket connected: ${user_id} (${userRole})`);
    socket.join(`user:${user_id}`);

    socket.on('join_conversation', async (conversation_id: string) => {
      try {
        const { allowed, conversation } = await verifyConversationAccess(conversation_id, user_id);
        if (!allowed || !conversation) {
          socket.emit('error', { message: 'Access denied to this conversation' });
          return;
        }

        socket.join(getConversationRoom(conversation_id));
        addConversationActivity(user_id, conversation_id);

        const participantIds = [conversation.employer_id, conversation.student_id];
        participantIds.forEach((participantId) => {
          io?.to(socket.id).emit('conversation:presence', {
            conversation_id,
            user_id: participantId,
            is_online: isUserOnline(participantId),
            last_seen_at: getUserLastSeenAt(participantId),
          });
        });

        broadcastConversationPresence(conversation_id, user_id);
      } catch (error: any) {
        logger.error('Error joining conversation room:', error);
        socket.emit('error', { message: 'Failed to join conversation' });
      }
    });

    socket.on('leave_conversation', (conversation_id: string) => {
      socket.leave(getConversationRoom(conversation_id));
      removeConversationActivity(user_id, conversation_id);
      broadcastConversationPresence(conversation_id, user_id);
    });

    socket.on('typing:start', async (payload: { conversation_id?: string }) => {
      if (!payload?.conversation_id) return;
      const { allowed } = await verifyConversationAccess(payload.conversation_id, user_id);
      if (!allowed) return;

      socket.to(getConversationRoom(payload.conversation_id)).emit('conversation:typing', {
        conversation_id: payload.conversation_id,
        user_id,
        is_typing: true,
      });
    });

    socket.on('typing:stop', async (payload: { conversation_id?: string }) => {
      if (!payload?.conversation_id) return;
      const { allowed } = await verifyConversationAccess(payload.conversation_id, user_id);
      if (!allowed) return;

      socket.to(getConversationRoom(payload.conversation_id)).emit('conversation:typing', {
        conversation_id: payload.conversation_id,
        user_id,
        is_typing: false,
      });
    });

    socket.on('join_dispute', async (dispute_id: string) => {
      try {
        const dispute = await DB.Disputes.findOne({
          where: { dispute_id },
        });

        if (!dispute) {
          socket.emit('error', { message: 'Dispute not found' });
          return;
        }

        const isAdmin =
          userRole?.toLowerCase() === 'superadmin' ||
          (await DB.Users.findOne({
            where: { user_id },
            include: [
              {
                model: DB.Roles,
                as: 'role',
                attributes: ['roleType'],
              },
            ],
          }))?.role?.roleType === 'admin';

        if (!isAdmin && dispute.student_id !== user_id && dispute.employer_id !== user_id) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        socket.join(`dispute:${dispute_id}`);
        logger.info(`User ${user_id} joined dispute room: ${dispute_id}`);
        socket.emit('joined_dispute', { dispute_id });
      } catch (error: any) {
        logger.error('Error joining dispute room:', error);
        socket.emit('error', { message: 'Failed to join dispute room' });
      }
    });

    socket.on('leave_dispute', (dispute_id: string) => {
      socket.leave(`dispute:${dispute_id}`);
      logger.info(`User ${user_id} left dispute room: ${dispute_id}`);
    });

    socket.on('disconnect', () => {
      const activeConversations = userConversationActivity.get(user_id);
      removeSocketForUser(socket.id);

      if (activeConversations) {
        Array.from(activeConversations).forEach((conversation_id) => {
          removeConversationActivity(user_id, conversation_id);
          broadcastConversationPresence(conversation_id, user_id);
        });
      }
      logger.info(`Socket disconnected: ${user_id}`);
    });
  });

  logger.info('Socket.IO server initialized');
  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initializeSocket first.');
  }
  return io;
};

export const emitToUser = (user_id: string, event: string, data: any) => {
  if (io) {
    io.to(`user:${user_id}`).emit(event, data);
  }
};

export const emitToConversation = (conversation_id: string, event: string, data: any) => {
  if (io) {
    io.to(getConversationRoom(conversation_id)).emit(event, data);
  }
};

export const emitToDispute = (dispute_id: string, event: string, data: any) => {
  if (io) {
    io.to(`dispute:${dispute_id}`).emit(event, data);
  }
};

export { isUserOnline };
