import { Request, Response } from 'express';
import * as momoService from './momo.service';
import logger from '@/utils/logger';

/**
 * Generate MoMo access token (and cache it). Useful for testing or pre-warming.
 */
export async function getToken(req: Request, res: Response): Promise<void> {
    try {
        const accessToken = await momoService.getAccessToken();
        res.json({
            success: true,
            message: 'Token generated successfully',
            data: { accessToken },
        });
    } catch (error) {
        const { status, data } = momoService.toMoMoError(error);
        logger.error('MoMo getToken error:', error);
        res.status(status).json({ success: false, ...(typeof data === 'object' ? data : { message: data }) });
    }
}

/**
 * Request to Pay - initiate collection from payer's MoMo wallet.
 * Body: amount, currency, externalId, payer { partyIdType, partyId }, payerMessage?, payeeNote?
 */
export async function requestToPay(req: Request, res: Response): Promise<void> {
    try {
        const { amount, currency, externalId, payer, payerMessage, payeeNote } = req.body;
        if (!amount || !currency || !externalId || !payer?.partyId) {
            res.status(400).json({
                success: false,
                message: 'amount, currency, externalId and payer.partyId are required',
            });
            return;
        }
        const payload = {
            amount: String(amount),
            currency,
            externalId: String(externalId),
            payer: {
                partyIdType: payer.partyIdType || 'MSISDN',
                partyId: String(payer.partyId),
            },
            payerMessage,
            payeeNote,
        };
        const result = await momoService.requestToPay(payload);
        res.json({
            success: true,
            message: 'Payment request sent',
            data: { referenceId: result.referenceId },
        });
    } catch (error) {
        const { status, data } = momoService.toMoMoError(error);
        logger.error('MoMo requestToPay error:', error);
        res.status(status).json({ success: false, ...(typeof data === 'object' ? data : { message: data }) });
    }
}

/**
 * Get Request to Pay transaction status by reference ID.
 */
export async function getStatus(req: Request, res: Response): Promise<void> {
    try {
        const { referenceId } = req.params;
        if (!referenceId) {
            res.status(400).json({ success: false, message: 'referenceId is required' });
            return;
        }
        const data = await momoService.getTransactionStatus(referenceId);
        res.json({ success: true, data });
    } catch (error) {
        const { status, data } = momoService.toMoMoError(error);
        logger.error('MoMo getStatus error:', error);
        res.status(status).json({ success: false, ...(typeof data === 'object' ? data : { message: data }) });
    }
}

/**
 * Create invoice. Body: externalId, amount, currency, validityDuration?, intendedPayer, payee, description.
 */
export async function createInvoice(req: Request, res: Response): Promise<void> {
    try {
        const { externalId, amount, currency, validityDuration, intendedPayer, payee, description } = req.body;
        if (!externalId || !amount || !currency || !intendedPayer?.partyId || !payee?.partyId || !description) {
            res.status(400).json({
                success: false,
                message: 'externalId, amount, currency, intendedPayer.partyId, payee.partyId and description are required',
            });
            return;
        }
        const payload = {
            externalId: String(externalId),
            amount: String(amount),
            currency,
            validityDuration: validityDuration ?? '3600',
            intendedPayer: {
                partyIdType: intendedPayer.partyIdType || 'MSISDN',
                partyId: String(intendedPayer.partyId),
            },
            payee: {
                partyIdType: payee.partyIdType || 'MSISDN',
                partyId: String(payee.partyId),
            },
            description: String(description),
        };
        const result = await momoService.createInvoice(payload);
        res.json({
            success: true,
            message: 'Invoice created successfully',
            data: { referenceId: result.referenceId },
        });
    } catch (error) {
        const { status, data } = momoService.toMoMoError(error);
        logger.error('MoMo createInvoice error:', error);
        res.status(status).json({ success: false, ...(typeof data === 'object' ? data : { message: data }) });
    }
}

/**
 * Get invoice status by reference ID.
 */
export async function getInvoiceStatus(req: Request, res: Response): Promise<void> {
    try {
        const { referenceId } = req.params;
        if (!referenceId) {
            res.status(400).json({ success: false, message: 'referenceId is required' });
            return;
        }
        const data = await momoService.getInvoiceStatus(referenceId);
        res.json({ success: true, data });
    } catch (error) {
        const { status, data } = momoService.toMoMoError(error);
        logger.error('MoMo getInvoiceStatus error:', error);
        res.status(status).json({ success: false, ...(typeof data === 'object' ? data : { message: data }) });
    }
}

/**
 * Fund job with MoMo (Request to Pay). Body: jobId, payerPartyId (optional - uses profile mobile if omitted).
 */
export async function fundJob(req: Request, res: Response): Promise<void> {
    try {
        const userId = req.user?.user_id;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        const { jobId, payerPartyId } = req.body;
        if (!jobId) {
            res.status(400).json({ success: false, message: 'jobId is required' });
            return;
        }
        let partyId = payerPartyId;
        if (!partyId) {
            const { DB } = await import('@/database');
            const user = await DB.Users.findOne({ where: { user_id: userId }, attributes: ['mobile_number'] });
            const mobile = (user as { mobile_number?: string } | null)?.mobile_number;
            if (!mobile) {
                res.status(400).json({
                    success: false,
                    message: 'MoMo number required. Add mobile number in Profile or pass payerPartyId.',
                });
                return;
            }
            partyId = momoService.normalizePartyId(mobile);
        }
        const result = await momoService.fundJob(jobId, String(partyId), userId);
        res.json({
            success: true,
            message: 'Payment request sent. Approve on your MoMo app.',
            data: result,
        });
    } catch (error) {
        const err = error as Error;
        const { status, data } = momoService.toMoMoError(error);
        logger.error('MoMo fundJob error:', error);
        res.status(status).json({ success: false, message: err.message, ...(typeof data === 'object' ? data : { message: data }) });
    }
}

/**
 * Admin: list employer payments / job funding status (jobs with Pending or Funded).
 */
export async function listJobPayments(req: Request, res: Response): Promise<void> {
    try {
        const { DB } = await import('@/database');
        const { Op } = await import('sequelize');
        const jobs = await DB.Jobs.findAll({
            where: { funding_status: { [Op.in]: ['Pending', 'Funded'] } },
            include: [
                { model: DB.Users, as: 'employer', attributes: ['user_id', 'full_name', 'email', 'mobile_number'] },
            ],
            order: [['momo_paid_at', 'DESC'], ['updated_at', 'DESC']],
        });
        const list = (jobs as unknown[]).map((j: Record<string, unknown>) => ({
            job_id: j.job_id,
            job_title: j.job_title,
            budget: j.budget,
            funding_status: j.funding_status,
            momo_reference_id: j.momo_reference_id,
            momo_paid_at: j.momo_paid_at,
            employer: (j as { employer?: Record<string, unknown> }).employer,
        }));
        res.json({ success: true, data: list });
    } catch (error) {
        logger.error('MoMo listJobPayments error:', error);
        res.status(500).json({ success: false, message: (error as Error).message });
    }
}

/**
 * MoMo callback/webhook - called by MTN when payment status changes. No auth.
 */
export async function callback(req: Request, res: Response): Promise<void> {
    try {
        momoService.parseCallbackPayload(req.body || req.query);
        res.status(200).json({ message: 'Callback received' });
    } catch (error) {
        logger.error('MoMo callback error:', error);
        res.status(200).json({ message: 'Callback received' });
    }
}
