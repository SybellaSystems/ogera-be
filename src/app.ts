import express from 'express';
const app = express();
import cors from 'cors';
import { 
    errorHandler, 
    notFoundHandler, 
    AppError, 
    asyncHandler,
    setupProcessHandlers
} from './middlewares/errorHandler.js';
import authRouter from './modules/auth/routes/auth.route.js';
import { authenticationMiddleware } from './middlewares/authMiddleware.js';


setupProcessHandlers();
app.use(express.json());
app.use(cors());


app.use('/api/v1/auth/', authRouter);
app.get('/', authenticationMiddleware, (req, res) => {
    res.send('Base route.');
});

app.use(notFoundHandler);

app.use(errorHandler({
    includeStackTrace: process.env.NODE_ENV === 'development',
    customErrorMap: new Map([
      ['CUSTOM_ERROR', { statusCode: 422, message: 'Custom error occurred' }]
    ])
}));

export default app;