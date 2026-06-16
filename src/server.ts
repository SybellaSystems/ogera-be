import express from 'express';
import path from 'path';
import { createServer } from "http";
import cors from 'cors';
import cookieParser from 'cookie-parser';
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
import { initializeSocket } from './utils/socket';
import { startEmailDigestSchedulers } from './schedulers/emailDigests.scheduler';
import { startBadgeSubscriptionScheduler } from './schedulers/badgeSubscription.scheduler';

const appServer = express();
const httpServer = createServer(appServer);

// Render/Vercel sit behind a reverse proxy; required for secure cookies & HTTPS detection.
appServer.set('trust proxy', 1);
// const port = PORT;
const port = process.env.PORT || 5000;
// const corsOrigin = FRONTEND_URL || 'http://localhost:5173';
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:3001',
  'https://ogera-frontend.vercel.app',
  'https://ogera-frontend-hguj.vercel.app',
  'https://app.ogera.sybellasystems.co.rw',
  'https://ogera.sybellasystems.co.rw',
  ...(FRONTEND_URL ? [FRONTEND_URL.replace(/\/$/, '')] : []),
].filter((origin, index, list) => list.indexOf(origin) === index);

// In development we allow all origins; in production we reflect the configured frontend URL.
// const corsOptions: cors.CorsOptions = {
//     origin:
//         NODE_ENV === 'development'
//             ? true
//             : corsOrigin,
//     credentials: true,
//      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
// };
const corsOptions: cors.CorsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else if (
      NODE_ENV !== 'production' &&
      /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)
    ) {
      // Allow Vercel preview deployments in non-production API environments.
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
};

// Enable CORS with the configured options

appServer.options('*', cors(corsOptions));
appServer.use(cors(corsOptions));

helmetMiddleware(appServer);

// Initialize SMS Provider
initializeSMSProvider(SMS_CONFIG.provider, {
    accountSid: SMS_CONFIG.twilio.accountSid,
    authToken: SMS_CONFIG.twilio.authToken,
    fromNumber: SMS_CONFIG.twilio.fromNumber,
});

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

// Serve uploaded files
appServer.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

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
        
        // Initialize Socket.IO
        initializeSocket(httpServer);
        
        httpServer.listen(port, () => {
            // logger.info(`Server is running on http://localhost:${port}`);
            logger.info(`Server is running on port ${port}`);
            startEmailDigestSchedulers();
            startBadgeSubscriptionScheduler();
        });
    })
    .catch(error => {
        logger.error('Unable to connect to the database:', error);
    });
