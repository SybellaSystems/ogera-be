import express from 'express';
import path from 'path';
import cors from 'cors';
import cookieParser from "cookie-parser";
import router from '@routes/routes';
import logger from '@utils/logger';
import { DB } from '@database/index';
import { PORT, SMS_CONFIG, STORAGE_CONFIG } from './config';
import { errorHandler } from './utils/error-handler';
import { swaggerSpec, swaggerUi } from './utils/swagger';
import { apiLimiter } from './middlewares/rateLimiter.middleware';
import { helmetMiddleware } from './middlewares/helmet.middleware';
import { requestLoggerMiddleware } from './middlewares/requestLogger.middleware';
import { initializeSMSProvider } from './utils/sms';

const appServer = express();
const port = PORT;

const corsOptions = {
    origin: 'http://localhost:5173',
    credentials: true,
};

helmetMiddleware(appServer);

// Initialize SMS Provider
initializeSMSProvider(SMS_CONFIG.provider, {
    accountSid: SMS_CONFIG.twilio.accountSid,
    authToken: SMS_CONFIG.twilio.authToken,
    fromNumber: SMS_CONFIG.twilio.fromNumber,
});

// Enable CORS
appServer.use(cors(corsOptions));
appServer.options('*', cors(corsOptions));

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

// Serve uploaded files statically (allow cross-origin loading for images)
appServer.use('/uploads', (_req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
}, express.static(path.resolve(STORAGE_CONFIG.localStoragePath)));

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
        appServer.listen(port, () => {
            logger.info(`Server is running on http://localhost:${port}`);
        });
    })
    .catch(error => {
        logger.error('Unable to connect to the database:', error);
    });
