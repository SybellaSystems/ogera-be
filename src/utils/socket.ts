import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { verify } from 'jsonwebtoken';
import { JWT_ACCESS_TOKEN_SECRET } from '@/config';
import { DB } from '@/database';
import logger from './logger';

let io: SocketIOServer | null = null;

export const initializeSocket = (httpServer: HTTPServer) => {
    io = new SocketIOServer(httpServer, {
        cors: {
            origin: 'http://localhost:5173',
            credentials: true,
        },
    });

    // Authentication middleware for socket connections
    io.use(async (socket: Socket, next) => {
        try {
            const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
            
            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }

            const decoded: any = verify(token, JWT_ACCESS_TOKEN_SECRET!);
            
            // Verify user exists
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

            // Attach user info to socket
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
        
        logger.info(`Socket connected: ${user_id} (${userRole})`);

        // Join user's personal room for notifications
        socket.join(`user:${user_id}`);

        // Join dispute room if user is viewing a dispute
        socket.on('join_dispute', async (dispute_id: string) => {
            try {
                // Verify user has access to this dispute
                const dispute = await DB.Disputes.findOne({
                    where: { dispute_id },
                });

                if (!dispute) {
                    socket.emit('error', { message: 'Dispute not found' });
                    return;
                }

                // Check access: student/employer can only join their own disputes
                // Admin/superadmin can join any dispute
                const isAdmin = userRole?.toLowerCase() === 'superadmin' || 
                               (await DB.Users.findOne({
                                   where: { user_id },
                                   include: [{
                                       model: DB.Roles,
                                       as: 'role',
                                       attributes: ['roleType'],
                                   }],
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

        // Leave dispute room
        socket.on('leave_dispute', (dispute_id: string) => {
            socket.leave(`dispute:${dispute_id}`);
            logger.info(`User ${user_id} left dispute room: ${dispute_id}`);
        });

        socket.on('disconnect', () => {
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

// Helper function to emit to a specific user
export const emitToUser = (user_id: string, event: string, data: any) => {
    if (io) {
        io.to(`user:${user_id}`).emit(event, data);
    }
};

// Helper function to emit to a dispute room
export const emitToDispute = (dispute_id: string, event: string, data: any) => {
    if (io) {
        io.to(`dispute:${dispute_id}`).emit(event, data);
    }
};

