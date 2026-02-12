"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const routes_1 = __importDefault(require("./routes/routes"));
const logger_1 = __importDefault(require("./utils/logger"));
const index_1 = require("./database/index");
const config_1 = require("./config");
const error_handler_1 = require("./utils/error-handler");
const swagger_1 = require("./utils/swagger");
const rateLimiter_middleware_1 = require("./middlewares/rateLimiter.middleware");
const helmet_middleware_1 = require("./middlewares/helmet.middleware");
const requestLogger_middleware_1 = require("./middlewares/requestLogger.middleware");
const sms_1 = require("./utils/sms");
const appServer = (0, express_1.default)();
const port = config_1.PORT;
const corsOptions = {
    origin: 'http://localhost:5173',
    credentials: true,
};
(0, helmet_middleware_1.helmetMiddleware)(appServer);
// Initialize SMS Provider
(0, sms_1.initializeSMSProvider)(config_1.SMS_CONFIG.provider, {
    accountSid: config_1.SMS_CONFIG.twilio.accountSid,
    authToken: config_1.SMS_CONFIG.twilio.authToken,
    fromNumber: config_1.SMS_CONFIG.twilio.fromNumber,
});
// Enable CORS
appServer.use((0, cors_1.default)(corsOptions));
appServer.options('*', (0, cors_1.default)(corsOptions));
// Body parsers (must be before logging middleware to capture request body)
appServer.use(express_1.default.json());
appServer.use(express_1.default.urlencoded({ extended: true }));
// Comprehensive API Request/Response Logging Middleware
// Must be placed after body parsers to capture parsed request data
appServer.use(requestLogger_middleware_1.requestLoggerMiddleware);
// ⭐ USE COOKIE PARSER (VERY IMPORTANT)
appServer.use((0, cookie_parser_1.default)());
// Swagger
appServer.use('/api-docs', swagger_1.swaggerUi.serve, swagger_1.swaggerUi.setup(swagger_1.swaggerSpec));
appServer.use('/api', rateLimiter_middleware_1.apiLimiter);
// Serve uploaded files statically (allow cross-origin loading for images)
appServer.use('/uploads', (_req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
}, express_1.default.static(path_1.default.resolve(config_1.STORAGE_CONFIG.localStoragePath)));
// API routes
appServer.use('/api', routes_1.default);
// Error handler
appServer.use(error_handler_1.errorHandler);
appServer.all('*', (req, res) => {
    res.status(404).json({ message: 'Sorry! Page not found' });
});
index_1.DB.sequelize
    .authenticate()
    .then(() => {
    logger_1.default.info('Database connected successfully!');
    appServer.listen(port, () => {
        logger_1.default.info(`Server is running on http://localhost:${port}`);
    });
})
    .catch(error => {
    logger_1.default.error('Unable to connect to the database:', error);
});
