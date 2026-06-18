import { Request, Response } from 'express';
import * as momoService from './momo.service';
import logger from '@/utils/logger';
import { MOMO_DISBURSEMENT_CONFIG } from '@/config';

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
        const data = await momoService.getTransactionStatus(String(referenceId));
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
        const data = await momoService.getInvoiceStatus(String(referenceId));
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
            where: { funding_status: { [Op.in]: ['Pending', 'Funded', 'Paid'] } },
            include: [
                { model: DB.Users, as: 'employer', attributes: ['user_id', 'full_name', 'email', 'mobile_number'] },
                {
                    model: DB.Transactions,
                    as: 'transactions',
                    required: false,
                    where: {
                        type: {
                            [Op.in]: [
                                'JOB_FUNDING_CREDIT',
                                'JOB_PAYOUT_WALLET_DEBIT',
                                'STUDENT_PAYOUT_DISBURSEMENT',
                            ],
                        },
                    },
                },
            ],
            order: [['momo_paid_at', 'DESC'], ['updated_at', 'DESC']],
        });
        const list = (jobs as Array<Record<string, any>>).map((j) => {
            const txs = (j as any).transactions || [];
            const fundingTx = txs.find((t: any) => t.type === 'JOB_FUNDING_CREDIT');
            const payoutWalletTx = txs.find((t: any) => t.type === 'JOB_PAYOUT_WALLET_DEBIT');
            const payoutStudentTx = txs.find((t: any) => t.type === 'STUDENT_PAYOUT_DISBURSEMENT');
            return {
                job_id: j.job_id,
                job_title: j.job_title,
                budget: j.budget,
                currency: j.currency || 'USD',
                funding_status: j.funding_status,
                momo_reference_id: j.momo_reference_id,
                momo_paid_at: j.momo_paid_at,
                disbursement_reference_id: j.disbursement_reference_id,
                paid_at: j.paid_at,
                amount_paid_to_student: payoutStudentTx ? Number(payoutStudentTx.converted_amount) : null,
                amount_paid_to_student_currency: payoutStudentTx?.converted_currency || null,
                wallet_deduction_amount: payoutWalletTx ? Number(payoutWalletTx.converted_amount) : null,
                wallet_currency: payoutWalletTx?.converted_currency || MOMO_DISBURSEMENT_CONFIG.currency,
                transaction_details: {
                    funding: fundingTx
                        ? {
                              original_amount: Number(fundingTx.original_amount),
                              original_currency: fundingTx.original_currency,
                              converted_amount: Number(fundingTx.converted_amount),
                              converted_currency: fundingTx.converted_currency,
                              exchange_rate: Number(fundingTx.exchange_rate),
                              fx_timestamp: fundingTx.fx_timestamp,
                          }
                        : null,
                    wallet_deduction: payoutWalletTx
                        ? {
                              original_amount: Number(payoutWalletTx.original_amount),
                              original_currency: payoutWalletTx.original_currency,
                              converted_amount: Number(payoutWalletTx.converted_amount),
                              converted_currency: payoutWalletTx.converted_currency,
                              exchange_rate: Number(payoutWalletTx.exchange_rate),
                              fx_timestamp: payoutWalletTx.fx_timestamp,
                          }
                        : null,
                    student_payout: payoutStudentTx
                        ? {
                              original_amount: Number(payoutStudentTx.original_amount),
                              original_currency: payoutStudentTx.original_currency,
                              converted_amount: Number(payoutStudentTx.converted_amount),
                              converted_currency: payoutStudentTx.converted_currency,
                              exchange_rate: Number(payoutStudentTx.exchange_rate),
                              fx_timestamp: payoutStudentTx.fx_timestamp,
                          }
                        : null,
                },
                employer: (j as { employer?: Record<string, unknown> }).employer,
            };
        });
        res.json({ success: true, data: list });
    } catch (error) {
        logger.error('MoMo listJobPayments error:', error);
        res.status(500).json({ success: false, message: (error as Error).message });
    }
}

/**
 * Employer/Admin: get one job payment detail including FX conversion breakdown.
 */
export async function getJobPaymentDetail(req: Request, res: Response): Promise<void> {
    try {
        const userId = req.user?.user_id;
        const userRole = String(req.user?.role || '').toLowerCase().trim();
        const { jobId } = req.params as { jobId: string };
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        if (!jobId) {
            res.status(400).json({ success: false, message: 'jobId is required' });
            return;
        }

        const { DB } = await import('@/database');
        const { Op } = await import('sequelize');
        const job = (await DB.Jobs.findOne({
            where: { job_id: jobId },
            include: [
                { model: DB.Users, as: 'employer', attributes: ['user_id', 'full_name', 'email', 'mobile_number'] },
                {
                    model: DB.Transactions,
                    as: 'transactions',
                    required: false,
                    where: {
                        type: {
                            [Op.in]: [
                                'JOB_FUNDING_CREDIT',
                                'JOB_PAYOUT_WALLET_DEBIT',
                                'STUDENT_PAYOUT_DISBURSEMENT',
                            ],
                        },
                    },
                },
            ],
        })) as any;

        if (!job) {
            res.status(404).json({ success: false, message: 'Job not found' });
            return;
        }

        const isAdminLike = userRole.includes('admin');
        if (!isAdminLike && job.employer_id !== userId) {
            res.status(403).json({ success: false, message: 'You can only view your own job payment details' });
            return;
        }

        const txs = job.transactions || [];
        const fundingTx = txs.find((t: any) => t.type === 'JOB_FUNDING_CREDIT');
        const payoutWalletTx = txs.find((t: any) => t.type === 'JOB_PAYOUT_WALLET_DEBIT');
        const payoutStudentTx = txs.find((t: any) => t.type === 'STUDENT_PAYOUT_DISBURSEMENT');

        const payload = {
            job_id: job.job_id,
            job_title: job.job_title,
            budget: Number(job.budget) || 0,
            currency: job.currency || 'USD',
            funding_status: job.funding_status,
            momo_reference_id: job.momo_reference_id,
            momo_paid_at: job.momo_paid_at,
            disbursement_reference_id: job.disbursement_reference_id,
            paid_at: job.paid_at,
            employer: job.employer,
            amount_paid_to_student: payoutStudentTx ? Number(payoutStudentTx.converted_amount) : null,
            amount_paid_to_student_currency: payoutStudentTx?.converted_currency || null,
            wallet_deduction_amount: payoutWalletTx ? Number(payoutWalletTx.converted_amount) : null,
            wallet_currency: payoutWalletTx?.converted_currency || 'USD',
            transaction_details: {
                funding: fundingTx
                    ? {
                          original_amount: Number(fundingTx.original_amount),
                          original_currency: fundingTx.original_currency,
                          converted_amount: Number(fundingTx.converted_amount),
                          converted_currency: fundingTx.converted_currency,
                          exchange_rate: Number(fundingTx.exchange_rate),
                          fx_timestamp: fundingTx.fx_timestamp,
                      }
                    : null,
                wallet_deduction: payoutWalletTx
                    ? {
                          original_amount: Number(payoutWalletTx.original_amount),
                          original_currency: payoutWalletTx.original_currency,
                          converted_amount: Number(payoutWalletTx.converted_amount),
                          converted_currency: payoutWalletTx.converted_currency,
                          exchange_rate: Number(payoutWalletTx.exchange_rate),
                          fx_timestamp: payoutWalletTx.fx_timestamp,
                      }
                    : null,
                student_payout: payoutStudentTx
                    ? {
                          original_amount: Number(payoutStudentTx.original_amount),
                          original_currency: payoutStudentTx.original_currency,
                          converted_amount: Number(payoutStudentTx.converted_amount),
                          converted_currency: payoutStudentTx.converted_currency,
                          exchange_rate: Number(payoutStudentTx.exchange_rate),
                          fx_timestamp: payoutStudentTx.fx_timestamp,
                      }
                    : null,
            },
        };

        res.json({ success: true, data: payload });
    } catch (error) {
        logger.error('MoMo getJobPaymentDetail error:', error);
        res.status(500).json({ success: false, message: (error as Error).message });
    }
}

/**
 * Approve work and pay student (employer only). Body: jobId.
 * Job must be Funded and have one Accepted application. Transfers job.budget to student MoMo and marks job as Paid.
 */
export async function approveWorkAndPay(req: Request, res: Response): Promise<void> {
    try {
        const userId = req.user?.user_id;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        const { jobId } = req.body;
        if (!jobId) {
            res.status(400).json({ success: false, message: 'jobId is required' });
            return;
        }
        const result = await momoService.payStudentForJob(String(jobId), userId);
        res.json({
            success: true,
            message: 'Student paid successfully. Job marked as Paid.',
            data: result,
        });
    } catch (error) {
        const err = error as Error;
        const { status, data } = momoService.toMoMoError(error);
        logger.error('MoMo approveWorkAndPay error:', error);
        res.status(status).json({ success: false, message: err.message, ...(typeof data === 'object' ? data : { message: data }) });
    }
}

/**
 * Get Ogera wallet balance (computed from jobs – admin only).
 * We calculate: sum(employer payments: budget + fee) - sum(amounts paid to students).
 */
export async function getWalletBalance(req: Request, res: Response): Promise<void> {
    try {
        const { DB } = await import('@/database');
        const { Op } = await import('sequelize');
        const credits = await DB.Transactions.findAll({
            where: {
                type: { [Op.in]: ['JOB_FUNDING_CREDIT', 'BADGE_SUBSCRIPTION_CREDIT'] },
            },
            attributes: ['converted_amount', 'converted_currency'],
        });
        const debits = await DB.Transactions.findAll({
            where: { type: 'JOB_PAYOUT_WALLET_DEBIT' },
            attributes: ['converted_amount', 'converted_currency'],
        });

        let totalReceived = 0;
        let totalPaidToStudents = 0;
        let walletCurrency = 'USD';

        for (const tx of credits as Array<{ converted_amount?: number; converted_currency?: string }>) {
            totalReceived += Number(tx.converted_amount) || 0;
            walletCurrency = tx.converted_currency || walletCurrency;
        }
        for (const tx of debits as Array<{ converted_amount?: number; converted_currency?: string }>) {
            totalPaidToStudents += Number(tx.converted_amount) || 0;
            walletCurrency = tx.converted_currency || walletCurrency;
        }

        const available = Math.max(
            0,
            Math.round((totalReceived - totalPaidToStudents) * 1_000_000) / 1_000_000,
        );

        res.json({
            success: true,
            data: {
                availableBalance: String(available),
                currency: walletCurrency,
            },
        });
    } catch (error) {
        const { status, data } = momoService.toMoMoError(error);
        logger.error('MoMo getWalletBalance error:', error);
        res.status(status).json({ success: false, ...(typeof data === 'object' ? data : { message: data }) });
    }
}

/**
 * Get disbursement transfer status (for admin or employer to check payout status).
 */
export async function getDisbursementStatus(req: Request, res: Response): Promise<void> {
    try {
        const { referenceId } = req.params;
        if (!referenceId) {
            res.status(400).json({ success: false, message: 'referenceId is required' });
            return;
        }
        const data = await momoService.getDisbursementTransferStatus(String(referenceId));
        res.json({ success: true, data });
    } catch (error) {
        const { status, data } = momoService.toMoMoError(error);
        logger.error('MoMo getDisbursementStatus error:', error);
        res.status(status).json({ success: false, ...(typeof data === 'object' ? data : { message: data }) });
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
