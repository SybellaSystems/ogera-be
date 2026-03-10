import http from 'http';
import express from 'express';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import cookieParser from "cookie-parser";  
import { createServer } from 'http';
import router from '@routes/routes';
import logger from '@utils/logger';
import { DB } from '@database/index';
import { PORT, FRONTEND_URL, NODE_ENV, SMS_CONFIG } from './config';
import { errorHandler } from './utils/error-handler';
import { swaggerSpec, swaggerUi } from './utils/swagger';
import { apiLimiter } from './middlewares/rateLimiter.middleware';
import { helmetMiddleware } from './middlewares/helmet.middleware';
import { requestLoggerMiddleware } from './middlewares/requestLogger.middleware';
import { initializeSMSProvider } from './utils/sms';
import { setupCourseChatSocket } from './socket/courseChat.socket';

const appServer = express();
const port = PORT;
const corsOrigin = FRONTEND_URL || 'http://localhost:5173';

// In development we allow all origins; in production we reflect the configured frontend URL.
const corsOptions: cors.CorsOptions = {
    origin:
        NODE_ENV === 'development'
            ? true
            : corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
};

appServer.options('*', cors(corsOptions));
appServer.use(cors(corsOptions));

helmetMiddleware(appServer);

// Initialize SMS Provider
initializeSMSProvider(SMS_CONFIG.provider, {
    accountSid: SMS_CONFIG.twilio.accountSid,
    authToken: SMS_CONFIG.twilio.authToken,
    fromNumber: SMS_CONFIG.twilio.fromNumber,
});

// Enable CORS


// Body parsers (must be before logging middleware to capture request body)
appServer.use(express.json());
appServer.use(express.urlencoded({ extended: true }));

// Comprehensive API Request/Response Logging Middleware
// Must be placed after body parsers to capture parsed request data
appServer.use(requestLoggerMiddleware);

// ⭐ USE COOKIE PARSER (VERY IMPORTANT)
appServer.use(cookieParser());

// Swagger
appServer.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

appServer.use('/api', apiLimiter);

// API routes
appServer.use('/api', router);

// Error handler
appServer.use(errorHandler);

appServer.all('*', (req, res) => {
    res.status(404).json({ message: 'Sorry! Page not found' });
});

DB.sequelize
    .authenticate()
    .then(() => {
        logger.info('Database connected successfully!');
        const httpServer = http.createServer(appServer);
        const io = new SocketIOServer(httpServer, {
            cors: { origin: corsOrigin, credentials: true },
            path: '/socket.io',
        });
        setupCourseChatSocket(io);
        httpServer.listen(port, () => {
            logger.info(`Server is running on http://localhost:${port}`);
            logger.info(`Socket.io course chat enabled`);
        });
    })
    .catch(error => {
        logger.error('Unable to connect to the database:', error);
    });
