import express from 'express';
import {
    submitPaymentOrder,
    getPaymentStatus,
    registerIPN,
    ipnCallback,
} from './pesapal.controller';
import { authMiddleware } from '@/middlewares/auth.middleware';

const pesapalRouter = express.Router();

// Submit order - requires auth
pesapalRouter.post('/submit-order', authMiddleware, submitPaymentOrder);

// Get transaction status - requires auth
pesapalRouter.get('/status/:orderTrackingId', authMiddleware, getPaymentStatus);

// Register IPN (admin/setup - can add auth for production)
pesapalRouter.post('/register-ipn', authMiddleware, registerIPN);

// IPN callback - NO auth, Pesapal server calls this
pesapalRouter.get('/ipn', ipnCallback);
pesapalRouter.post('/ipn', ipnCallback);

export default pesapalRouter;
