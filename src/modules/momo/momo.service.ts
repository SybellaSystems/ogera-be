import axios, { AxiosError } from 'axios';
import { randomUUID } from 'crypto';
import { MOMO_CONFIG, MOMO_DISBURSEMENT_CONFIG } from '@/config';
import logger from '@/utils/logger';
import { convertCurrency } from '@/utils/fx.service';

const { baseUrl, subscriptionKey, apiUserId, apiKey, targetEnvironment, currency: defaultCurrency } = MOMO_CONFIG;
const dispConfig = MOMO_DISBURSEMENT_CONFIG;
const OGERA_WALLET_CURRENCY = (process.env.OGERA_WALLET_CURRENCY || 'USD')
    .trim()
    .toUpperCase();
const STUDENT_SHARE_PERCENT = Number(process.env.STUDENT_SHARE_PERCENT || '90');
const MOMO_SUPPORTED_CURRENCIES = new Set(
    (process.env.MOMO_SUPPORTED_CURRENCIES || defaultCurrency || 'EUR')
        .split(',')
        .map((c) => c.trim().toUpperCase())
        .filter(Boolean),
);

function resolveMoMoDisbursementCurrency(requestedCurrency: string): string {
    const normalized = String(requestedCurrency || '').trim().toUpperCase();
    if (MOMO_SUPPORTED_CURRENCIES.has(normalized)) {
        return normalized;
    }
    return String(dispConfig.currency || defaultCurrency || 'EUR').toUpperCase();
}

let cachedAccessToken: string | null = null;

function getAuthHeader(): string {
    const basicAuth = Buffer.from(`${apiUserId}:${apiKey}`).toString('base64');
    return `Basic ${basicAuth}`;
}

function getHeaders(useBearer = false): Record<string, string> {
    const headers: Record<string, string> = {
        'Ocp-Apim-Subscription-Key': subscriptionKey,
        'Content-Type': 'application/json',
    };
    if (useBearer && cachedAccessToken) {
        headers['Authorization'] = `Bearer ${cachedAccessToken}`;
        headers['X-Target-Environment'] = targetEnvironment;
    }
    return headers;
}

/**
 * Generate MoMo Collection API access token (cached in memory).
 */
export async function getAccessToken(): Promise<string> {
    if (!subscriptionKey || !apiUserId || !apiKey) {
        throw new Error('MoMo is not configured. Set MOMO_SUBSCRIPTION_KEY, MOMO_USER_ID, MOMO_API_KEY.');
    }
    const response = await axios.post(
        `${baseUrl}/collection/token/`,
        {},
        {
            headers: {
                Authorization: getAuthHeader(),
                'Ocp-Apim-Subscription-Key': subscriptionKey,
            },
        }
    );
    cachedAccessToken = response.data?.access_token ?? null;
    if (!cachedAccessToken) throw new Error('MoMo token response missing access_token');
    return cachedAccessToken;
}

/**
 * Ensure we have a valid token; call getAccessToken if needed.
 */
async function ensureToken(): Promise<string> {
    if (cachedAccessToken) return cachedAccessToken;
    return getAccessToken();
}

async function withCollectionTokenRetry<T>(
    operation: () => Promise<T>,
    options?: { forceRefresh?: boolean },
): Promise<T> {
    if (options?.forceRefresh) {
        cachedAccessToken = null;
    }
    await ensureToken();
    try {
        return await operation();
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
            // Token expired/invalid in sandbox or production. Refresh once and retry.
            cachedAccessToken = null;
            await getAccessToken();
            return await operation();
        }
        throw error;
    }
}

async function createTransactionEntry(payload: Record<string, unknown>): Promise<void> {
    const { DB } = await import('@/database');
    if (!DB.Transactions) return;
    await DB.Transactions.create(payload as any);
}

async function settleJobFunding(referenceId: string): Promise<void> {
    const { DB } = await import('@/database');
    const job = (await DB.Jobs.findOne({
        where: { momo_reference_id: referenceId },
        attributes: ['job_id', 'job_title', 'budget', 'currency', 'employer_id', 'funding_status'],
    })) as any;
    if (!job) return;

    const alreadyLogged = await DB.Transactions.findOne({
        where: { reference_id: referenceId, type: 'JOB_FUNDING_CREDIT' },
    });

    if (!alreadyLogged) {
        const sourceCurrency = String(job.currency || defaultCurrency || 'USD').toUpperCase();
        const sourceAmount = Number(job.budget) || 0;
        const fundingFx = await convertCurrency(
            sourceAmount,
            sourceCurrency,
            OGERA_WALLET_CURRENCY,
        );

        await createTransactionEntry({
            user_id: job.employer_id,
            job_id: job.job_id,
            amount: sourceAmount,
            currency: sourceCurrency,
            type: 'JOB_FUNDING_CREDIT',
            reference_id: referenceId,
            original_amount: sourceAmount,
            original_currency: sourceCurrency,
            converted_amount: fundingFx.convertedAmount,
            converted_currency: OGERA_WALLET_CURRENCY,
            exchange_rate: fundingFx.rate,
            fx_timestamp: fundingFx.timestamp ? new Date(fundingFx.timestamp) : null,
            metadata: {
                stage: 'EMPLOYER_FUNDING',
                wallet_currency: OGERA_WALLET_CURRENCY,
                job_title: job.job_title,
                fx_provider: 'fxapi.app',
            },
            description: `Employer funded job ${job.job_id} in ${sourceCurrency}; credited wallet in ${OGERA_WALLET_CURRENCY}.`,
        });
    }

    if (job.funding_status !== 'Funded') {
        await DB.Jobs.update(
            { funding_status: 'Funded', momo_paid_at: new Date() },
            { where: { job_id: job.job_id } },
        );
    }
}

export interface RequestToPayPayload {
    amount: string;
    currency: string;
    externalId: string;
    payer: { partyIdType: string; partyId: string };
    payerMessage?: string;
    payeeNote?: string;
}

/**
 * Request to Pay (Collections) - initiate payment request to payer's MoMo wallet.
 */
export async function requestToPay(payload: RequestToPayPayload): Promise<{ referenceId: string }> {
    const referenceId = randomUUID();
    await withCollectionTokenRetry(async () => {
        await axios.post(
            `${baseUrl}/collection/v1_0/requesttopay`,
            {
                amount: payload.amount,
                currency: payload.currency,
                externalId: payload.externalId,
                payer: payload.payer,
                payerMessage: payload.payerMessage ?? 'Ogera payment',
                payeeNote: payload.payeeNote ?? 'Ogera job payment',
            },
            {
                headers: {
                    ...getHeaders(true),
                    'X-Reference-Id': referenceId,
                },
            }
        );
    });
    return { referenceId };
}

/**
 * Get Request to Pay transaction status.
 * If MoMo reports SUCCESSFUL, sync job to Funded (so UI and MoMo Payments page update even when callback is not received, e.g. in sandbox).
 */
export async function getTransactionStatus(referenceId: string): Promise<unknown> {
    const response = await withCollectionTokenRetry(async () =>
        axios.get(
            `${baseUrl}/collection/v1_0/requesttopay/${referenceId}`,
            { headers: getHeaders(true) }
        ),
    );
    const data = response.data as { status?: string };
    if (data?.status === 'SUCCESSFUL') {
        await settleJobFunding(referenceId);
        logger.info('Job marked as Funded from status check:', referenceId);
    }
    return response.data;
}

export interface CreateInvoicePayload {
    externalId: string;
    amount: string;
    currency: string;
    validityDuration?: string;
    intendedPayer: { partyIdType: string; partyId: string };
    payee: { partyIdType: string; partyId: string };
    description: string;
}

/**
 * Create invoice (Collections v2).
 */
export async function createInvoice(payload: CreateInvoicePayload): Promise<{ referenceId: string }> {
    const referenceId = randomUUID();
    await withCollectionTokenRetry(async () => {
        await axios.post(
            `${baseUrl}/collection/v2_0/invoice`,
            {
                externalId: payload.externalId,
                amount: payload.amount,
                currency: payload.currency,
                validityDuration: payload.validityDuration ?? '3600',
                intendedPayer: payload.intendedPayer,
                payee: payload.payee,
                description: payload.description,
            },
            {
                headers: {
                    ...getHeaders(true),
                    'X-Reference-Id': referenceId,
                },
            }
        );
    });
    return { referenceId };
}

/**
 * Get invoice status by reference ID.
 */
export async function getInvoiceStatus(referenceId: string): Promise<unknown> {
    const response = await withCollectionTokenRetry(async () =>
        axios.get(
            `${baseUrl}/collection/v2_0/invoice/${referenceId}`,
            { headers: getHeaders(true) }
        ),
    );
    return response.data;
}

/**
 * Normalize phone to MSISDN (e.g. 250xxxxxxxxx for Rwanda).
 */
export function normalizePartyId(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length >= 9) {
        if (digits.startsWith('250')) return digits;
        if (digits.length === 9) return '250' + digits;
        return digits.slice(-12);
    }
    return digits;
}

/**
 * Fund a job via MoMo Request to Pay: get job, calculate total (budget + fee), create request, update job.
 */
export async function fundJob(
    jobId: string,
    payerPartyId: string,
    userId: string
): Promise<{ referenceId: string; totalAmount: number; currency: string }> {
    const { DB } = await import('@/database');
    const job = await DB.Jobs.findOne({ where: { job_id: jobId } });
    if (!job) throw new Error('Job not found');
    const jobAny = job as { employer_id: string; budget: number; funding_status?: string };
    if (jobAny.employer_id !== userId) throw new Error('You can only fund your own job');
    if (jobAny.funding_status === 'Funded') throw new Error('Job is already funded');
    if (jobAny.funding_status === 'Pending') throw new Error('Payment already requested. Check your phone or wait for confirmation.');

    const budget = Number(jobAny.budget) || 0;
    const jobCurrency = String((job as any).currency || defaultCurrency || 'USD').toUpperCase();
    const totalAmount = budget;
    const amountStr = totalAmount.toFixed(0);

    const referenceId = (
        await requestToPay({
            amount: amountStr,
            currency: jobCurrency,
            externalId: jobId,
            payer: { partyIdType: 'MSISDN', partyId: normalizePartyId(payerPartyId) },
            payerMessage: `Ogera job: ${(job as { job_title?: string }).job_title || jobId}`,
            payeeNote: 'Job funding',
        })
    ).referenceId;

    await DB.Jobs.update(
        { funding_status: 'Pending', momo_reference_id: referenceId },
        { where: { job_id: jobId } }
    );
    return { referenceId, totalAmount, currency: jobCurrency };
}

/**
 * Handle MoMo callback: mark job as Funded when payment is successful.
 */
export async function handleCallback(body: unknown): Promise<void> {
    logger.info('MoMo callback received:', { body });
    const obj = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
    const referenceId = (obj.referenceId ?? obj.reference ?? obj['X-Reference-Id']) as string | undefined;
    const status = (obj.status ?? obj.paymentStatus) as string | undefined;
    if (!referenceId) return;

    if (status === 'SUCCESSFUL' || !status) {
        await settleJobFunding(referenceId);
        logger.info('Job marked as Funded for reference:', referenceId);
    }
}

/**
 * Parse MoMo callback payload (when MTN sends payment status updates).
 */
export function parseCallbackPayload(body: unknown): void {
    handleCallback(body).catch((err) => logger.error('MoMo handleCallback error:', err));
}

// --- Disbursement (pay students from Ogera wallet) ---

let cachedDisbursementToken: string | null = null;

function getDisbursementAuthHeader(): string {
    const basicAuth = Buffer.from(`${dispConfig.apiUserId}:${dispConfig.apiKey}`).toString('base64');
    return `Basic ${basicAuth}`;
}

async function getDisbursementToken(): Promise<string> {
    if (!dispConfig.subscriptionKey || !dispConfig.apiUserId || !dispConfig.apiKey) {
        throw new Error('MoMo Disbursement is not configured. Set MOMO_DISBURSEMENT_SUBSCRIPTION_KEY, MOMO_DISBURSEMENT_USER_ID, MOMO_DISBURSEMENT_API_KEY.');
    }
    const response = await axios.post(
        `${dispConfig.baseUrl}/disbursement/token/`,
        {},
        {
            headers: {
                Authorization: getDisbursementAuthHeader(),
                'Ocp-Apim-Subscription-Key': dispConfig.subscriptionKey,
            },
        }
    );
    cachedDisbursementToken = response.data?.access_token ?? null;
    if (!cachedDisbursementToken) throw new Error('MoMo Disbursement token response missing access_token');
    return cachedDisbursementToken;
}

async function withDisbursementTokenRetry<T>(operation: () => Promise<T>): Promise<T> {
    try {
        return await operation();
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
            cachedDisbursementToken = null;
            await getDisbursementToken();
            return await operation();
        }
        throw error;
    }
}

export interface DisbursementTransferPayload {
    amount: string;
    currency: string;
    externalId: string;
    partyId: string;
    payerMessage?: string;
    payeeNote?: string;
}

/**
 * Disbursement transfer: send money from Ogera wallet to payee (student) MoMo.
 */
export async function disbursementTransfer(payload: DisbursementTransferPayload): Promise<{ referenceId: string }> {
    if (!cachedDisbursementToken) {
        await getDisbursementToken();
    }
    const referenceId = randomUUID();
    await withDisbursementTokenRetry(async () => {
        await axios.post(
            `${dispConfig.baseUrl}/disbursement/v1_0/transfer`,
            {
                amount: payload.amount,
                currency: payload.currency,
                externalId: payload.externalId,
                payee: { partyIdType: 'MSISDN', partyId: normalizePartyId(payload.partyId) },
                payerMessage: payload.payerMessage ?? 'Ogera job payment',
                payeeNote: payload.payeeNote ?? 'Payment for completed job',
            },
            {
                headers: {
                    Authorization: `Bearer ${cachedDisbursementToken}`,
                    'X-Reference-Id': referenceId,
                    'X-Target-Environment': dispConfig.targetEnvironment,
                    'Ocp-Apim-Subscription-Key': dispConfig.subscriptionKey,
                    'Content-Type': 'application/json',
                },
            }
        );
    });
    return { referenceId };
}

/**
 * Get Ogera disbursement account balance (wallet total – money received from employers, available for payouts).
 */
export async function getDisbursementAccountBalance(): Promise<{ availableBalance: string; currency: string }> {
    if (!cachedDisbursementToken) {
        await getDisbursementToken();
    }
    const response = await withDisbursementTokenRetry(async () =>
        axios.get(
            `${dispConfig.baseUrl}/disbursement/v1_0/account/balance`,
            {
                headers: {
                    Authorization: `Bearer ${cachedDisbursementToken}`,
                    'X-Target-Environment': dispConfig.targetEnvironment,
                    'Ocp-Apim-Subscription-Key': dispConfig.subscriptionKey,
                },
            }
        ),
    );
    const data = response.data as { availableBalance?: string; currency?: string };
    return {
        availableBalance: data?.availableBalance ?? '0',
        currency: data?.currency ?? dispConfig.currency,
    };
}

/**
 * Get disbursement transfer status by reference ID.
 */
export async function getDisbursementTransferStatus(referenceId: string): Promise<unknown> {
    if (!cachedDisbursementToken) {
        await getDisbursementToken();
    }
    const response = await withDisbursementTokenRetry(async () =>
        axios.get(
            `${dispConfig.baseUrl}/disbursement/v1_0/transfer/${referenceId}`,
            {
                headers: {
                    Authorization: `Bearer ${cachedDisbursementToken}`,
                    'X-Target-Environment': dispConfig.targetEnvironment,
                    'Ocp-Apim-Subscription-Key': dispConfig.subscriptionKey,
                },
            }
        ),
    );
    return response.data;
}

/**
 * Approve work and pay student: employer triggers this when work is done.
 * Job must be Funded; job must have exactly one Accepted application.
 * Transfers job.budget to student's MoMo, marks application completed_at and job as Paid.
 */
export async function payStudentForJob(jobId: string, userId: string): Promise<{ referenceId: string; amount: number }> {
    const { DB } = await import('@/database');
    const job = await DB.Jobs.findOne({
        where: { job_id: jobId },
        include: [
            {
                model: DB.JobApplications,
                as: 'jobApplications',
                where: { status: 'Accepted' },
                required: true,
                include: [
                    { model: DB.Users, as: 'student', attributes: ['user_id', 'full_name', 'mobile_number'] },
                ],
            },
        ],
    });
    if (!job) throw new Error('Job not found');
    const jobAny = job as {
        employer_id: string;
        budget: number;
        currency?: string;
        funding_status?: string;
        jobApplications?: Array<{
            application_id: string;
            preferred_payout_currency?: string;
            student?: { user_id?: string; mobile_number?: string };
        }>;
    };
    if (jobAny.employer_id !== userId) throw new Error('Only the job employer can approve work and pay the student');
    if (jobAny.funding_status === 'Paid') throw new Error('Student has already been paid for this job');
    if (jobAny.funding_status !== 'Funded') throw new Error('Job must be funded before paying the student');
    const applications = jobAny.jobApplications;
    if (!applications || applications.length === 0) throw new Error('No accepted application found for this job. Accept a student first.');
    if (applications.length > 1) throw new Error('Multiple accepted applications; only one student can be paid per job.');
    const student = applications[0].student;
    const mobile = student?.mobile_number;
    if (!mobile || !mobile.trim()) throw new Error('Student has no mobile number. Student must add MoMo number in profile to receive payment.');
    const budget = Number(jobAny.budget) || 0;
    if (budget <= 0) throw new Error('Job budget must be greater than zero');
    const jobCurrency = String(jobAny.currency || defaultCurrency || 'EUR').toUpperCase();
    const requestedPayoutCurrency = String(
        applications[0].preferred_payout_currency || jobCurrency,
    ).toUpperCase();
    const payoutCurrency = resolveMoMoDisbursementCurrency(requestedPayoutCurrency);
    const payoutAmountInJobCurrency =
        Math.round((budget * (STUDENT_SHARE_PERCENT / 100)) * 1_000_000) / 1_000_000;

    // Step 1: convert payout amount from job currency to wallet currency (USD).
    const toWalletFx = await convertCurrency(
        payoutAmountInJobCurrency,
        jobCurrency,
        OGERA_WALLET_CURRENCY,
    );
    const walletDeductionAmount = toWalletFx.convertedAmount;

    // Step 2: convert wallet amount from USD to student's preferred payout currency.
    const toStudentFx = await convertCurrency(
        walletDeductionAmount,
        OGERA_WALLET_CURRENCY,
        payoutCurrency,
    );
    const amountToStudent = toStudentFx.convertedAmount;
    const amountStr = String(Math.round(amountToStudent));
    const referenceId = (
        await disbursementTransfer({
            amount: amountStr,
            currency: payoutCurrency,
            externalId: jobId,
            partyId: mobile,
            payerMessage: `Ogera job payment: ${(job as { job_title?: string }).job_title || jobId}`,
            payeeNote: 'Payment for completed job',
        })
    ).referenceId;
    const applicationId = applications[0].application_id;
    await DB.JobApplications.update(
        { completed_at: new Date() },
        { where: { application_id: applicationId } }
    );
    await DB.Jobs.update(
        {
            funding_status: 'Paid',
            disbursement_reference_id: referenceId,
            paid_at: new Date(),
            status: 'Completed',
            amount_paid_to_student: walletDeductionAmount,
        },
        { where: { job_id: jobId } }
    );
    await createTransactionEntry({
        user_id: userId,
        job_id: jobId,
        amount: payoutAmountInJobCurrency,
        currency: jobCurrency,
        type: 'JOB_PAYOUT_WALLET_DEBIT',
        reference_id: referenceId,
        original_amount: payoutAmountInJobCurrency,
        original_currency: jobCurrency,
        converted_amount: walletDeductionAmount,
        converted_currency: OGERA_WALLET_CURRENCY,
        exchange_rate: toWalletFx.rate,
        fx_timestamp: toWalletFx.timestamp ? new Date(toWalletFx.timestamp) : null,
        metadata: {
            stage: 'WALLET_DEDUCTION',
            student_share_percent: STUDENT_SHARE_PERCENT,
            payout_currency: payoutCurrency,
            wallet_currency: OGERA_WALLET_CURRENCY,
        },
        description: `Wallet deduction for job payout ${jobId}: ${jobCurrency} -> ${OGERA_WALLET_CURRENCY}.`,
    });
    await createTransactionEntry({
        user_id: applications[0].student?.user_id || null,
        job_id: jobId,
        amount: walletDeductionAmount,
        currency: OGERA_WALLET_CURRENCY,
        type: 'STUDENT_PAYOUT_DISBURSEMENT',
        reference_id: referenceId,
        original_amount: walletDeductionAmount,
        original_currency: OGERA_WALLET_CURRENCY,
        converted_amount: amountToStudent,
        converted_currency: payoutCurrency,
        exchange_rate: toStudentFx.rate,
        fx_timestamp: toStudentFx.timestamp ? new Date(toStudentFx.timestamp) : null,
        metadata: {
            stage: 'STUDENT_DISBURSEMENT',
            disbursement_reference_id: referenceId,
            student_share_percent: STUDENT_SHARE_PERCENT,
            requested_payout_currency: requestedPayoutCurrency,
        },
        description: `Student payout for job ${jobId}: ${OGERA_WALLET_CURRENCY} -> ${payoutCurrency}.`,
    });
    logger.info('Job paid via disbursement', {
        jobId,
        referenceId,
        walletDeductionAmount,
        amountToStudent,
        payoutCurrency,
    });
    return { referenceId, amount: amountToStudent };
}

/**
 * Normalize MoMo API errors for JSON response.
 */
export function toMoMoError(error: unknown): { status: number; data: unknown } {
    if (axios.isAxiosError(error)) {
        const ax = error as AxiosError<{ message?: string; error?: string }>;
        const status = ax.response?.status ?? 500;
        const data = ax.response?.data ?? { message: ax.message };
        return { status, data };
    }
    const err = error as Error;
    return { status: 500, data: { message: err.message } };
}
