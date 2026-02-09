import { Pesapal } from 'pesapal-v3';
import { FRONTEND_URL } from '@/config';
import { PESAPAL_CONFIG } from '@/config';
import logger from '@/utils/logger';

export interface PesapalBillingAddress {
    email_address?: string;
    phone_number?: string;
    country_code?: string;
    first_name?: string;
    middle_name?: string;
    last_name?: string;
    line_1?: string;
    line_2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    zip_code?: string;
}

export interface PesapalSubmitOrderResponse {
    order_tracking_id: string;
    merchant_reference: string;
    redirect_url: string;
    status: string;
    error?: unknown;
}

export interface PesapalTransactionStatusResponse {
    payment_status_description?: string;
    payment_method: string;
    payment_account?: string;
    amount: number;
    currency: string;
    order_tracking_id?: string;
    merchant_reference?: string;
    status: string;
    error?: unknown;
}

const pesapalClient = new Pesapal({
    consumerKey: PESAPAL_CONFIG.consumerKey,
    consumerSecret: PESAPAL_CONFIG.consumerSecret,
    environment: PESAPAL_CONFIG.isSandbox ? 'sandbox' : 'production',
});

class PesapalService {
    async registerIPN(): Promise<string> {
        const ipnUrl = `${PESAPAL_CONFIG.baseUrl}/api/payments/ipn`;
        const response = await pesapalClient.registerIPN({
            url: ipnUrl,
            ipn_notification_type: 'GET',
        });

        if (!response.ipn_id) {
            throw new Error(
                (response as { error?: unknown }).error
                    ? JSON.stringify((response as { error?: unknown }).error)
                    : 'Failed to register IPN URL'
            );
        }

        return response.ipn_id;
    }

    async submitOrder(
        amount: number,
        currency: string,
        description: string,
        merchantReference: string,
        billingAddress: PesapalBillingAddress,
        notificationId: string
    ): Promise<PesapalSubmitOrderResponse> {
        const callbackUrl = `${FRONTEND_URL || 'http://localhost:5173'}/payment/callback`;
        const cancellationUrl = `${FRONTEND_URL || 'http://localhost:5173'}/payment/cancelled`;

        const payload = {
            id: merchantReference,
            currency,
            amount,
            description,
            callback_url: callbackUrl,
            cancellation_url: cancellationUrl,
            notification_id: notificationId,
            redirect_mode: 'TOP_WINDOW' as const,
            billing_address: billingAddress,
        };

        try {
            const data = await pesapalClient.submitOrder({
                ...payload,
            } as Parameters<typeof pesapalClient.submitOrder>[0]);

            const statusOk = String(data.status) === '200';
            if (!statusOk || !data.redirect_url) {
                logger.error('Pesapal SubmitOrderRequest failed:', {
                    response: data,
                });
                const errorMsg =
                    (data as { error?: { message?: string } }).error?.message ||
                    (data as { message?: string }).message ||
                    'Failed to submit order to Pesapal';
                throw new Error(errorMsg);
            }

            return data as PesapalSubmitOrderResponse;
        } catch (error: unknown) {
            const err = error as Error;
            logger.error('Pesapal submit order error:', err.message);
            throw err;
        }
    }

    async getTransactionStatus(
        orderTrackingId: string
    ): Promise<PesapalTransactionStatusResponse> {
        const data = await pesapalClient.getTransactionStatus(orderTrackingId);

        if (String(data.status) !== '200') {
            throw new Error(
                (data as { error?: unknown }).error
                    ? JSON.stringify((data as { error?: unknown }).error)
                    : 'Failed to get transaction status'
            );
        }

        return data as PesapalTransactionStatusResponse;
    }
}

export const pesapalService = new PesapalService();
