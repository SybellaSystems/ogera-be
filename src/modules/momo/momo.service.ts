import axios, { AxiosError } from 'axios';
import { randomUUID } from 'crypto';
import { MOMO_CONFIG } from '@/config';
import logger from '@/utils/logger';

const { baseUrl, subscriptionKey, apiUserId, apiKey, targetEnvironment, serviceFeePercent, currency: defaultCurrency } = MOMO_CONFIG;

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
    await ensureToken();
    const referenceId = randomUUID();
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
    return { referenceId };
}

/**
 * Get Request to Pay transaction status.
 * If MoMo reports SUCCESSFUL, sync job to Funded (so UI and MoMo Payments page update even when callback is not received, e.g. in sandbox).
 */
export async function getTransactionStatus(referenceId: string): Promise<unknown> {
    await ensureToken();
    const response = await axios.get(
        `${baseUrl}/collection/v1_0/requesttopay/${referenceId}`,
        { headers: getHeaders(true) }
    );
    const data = response.data as { status?: string };
    if (data?.status === 'SUCCESSFUL') {
        const { DB } = await import('@/database');
        const [rows] = await DB.Jobs.update(
            { funding_status: 'Funded', momo_paid_at: new Date() },
            { where: { momo_reference_id: referenceId } }
        );
        if (rows > 0) logger.info('Job marked as Funded from status check:', referenceId);
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
    await ensureToken();
    const referenceId = randomUUID();
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
    return { referenceId };
}

/**
 * Get invoice status by reference ID.
 */
export async function getInvoiceStatus(referenceId: string): Promise<unknown> {
    await ensureToken();
    const response = await axios.get(
        `${baseUrl}/collection/v2_0/invoice/${referenceId}`,
        { headers: getHeaders(true) }
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
    const fee = (serviceFeePercent / 100) * budget;
    const totalAmount = Math.round((budget + fee) * 100) / 100;
    const amountStr = totalAmount.toFixed(0);

    const referenceId = (
        await requestToPay({
            amount: amountStr,
            currency: defaultCurrency,
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
    return { referenceId, totalAmount, currency: defaultCurrency };
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

    const { DB } = await import('@/database');
    const [rows] = await DB.Jobs.update(
        { funding_status: 'Funded', momo_paid_at: new Date() },
        { where: { momo_reference_id: referenceId } }
    );
    if (rows > 0 && (status === 'SUCCESSFUL' || !status)) {
        logger.info('Job marked as Funded for reference:', referenceId);
    }
}

/**
 * Parse MoMo callback payload (when MTN sends payment status updates).
 */
export function parseCallbackPayload(body: unknown): void {
    handleCallback(body).catch((err) => logger.error('MoMo handleCallback error:', err));
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
