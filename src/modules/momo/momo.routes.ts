import express from 'express';
import {
    getToken,
    requestToPay,
    getStatus,
    createInvoice,
    getInvoiceStatus,
    fundJob,
    listJobPayments,
    getWalletBalance,
    approveWorkAndPay,
    getDisbursementStatus,
    callback,
} from './momo.controller';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { adminOrSuperadminOnly } from '@/middlewares/role.middleware';

const momoRouter = express.Router();

// Token (optional: for testing; other endpoints auto-fetch token)
momoRouter.get('/token', getToken);

// Fund job (employer) - job amount + fee, request to pay to employer's MoMo
momoRouter.post('/fund-job', authMiddleware, fundJob);

// Admin: employer payments / job funding status (includes Paid)
momoRouter.get('/admin/payments', authMiddleware, adminOrSuperadminOnly, listJobPayments);

// Admin: Ogera wallet balance (disbursement account total)
momoRouter.get('/admin/wallet-balance', authMiddleware, adminOrSuperadminOnly, getWalletBalance);

// Employer: approve work and pay student via disbursement (job must be Funded, one Accepted application)
momoRouter.post('/approve-work-and-pay', authMiddleware, approveWorkAndPay);

// Disbursement transfer status (auth)
momoRouter.get('/disbursement-status/:referenceId', authMiddleware, getDisbursementStatus);

// Request to Pay - requires auth
momoRouter.post('/request-to-pay', authMiddleware, requestToPay);

// Transaction status - requires auth
momoRouter.get('/status/:referenceId', authMiddleware, getStatus);

// Create invoice - requires auth
momoRouter.post('/create-invoice', authMiddleware, createInvoice);

// Invoice status - requires auth
momoRouter.get('/invoice-status/:referenceId', authMiddleware, getInvoiceStatus);

// Callback from MTN - no auth (MTN server calls this)
momoRouter.post('/callback', callback);
momoRouter.get('/callback', callback);

export default momoRouter;
