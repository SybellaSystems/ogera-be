import { Request, Response } from 'express';
import { pesapalService } from './pesapal.service';
import { PESAPAL_CONFIG } from '@/config';
import logger from '@/utils/logger';

/**
 * Submit a payment order to Pesapal
 * Returns redirect_url to open in new window for payment
 */
export async function submitPaymentOrder(req: Request, res: Response): Promise<void> {
    try {
        const { amount, currency = 'KES', description } = req.body;
        const user = req.user;

        if (!amount || amount <= 0) {
            res.status(400).json({
                success: false,
                message: 'Valid amount is required',
            });
            return;
        }

        if (!PESAPAL_CONFIG.consumerKey || !PESAPAL_CONFIG.consumerSecret) {
            res.status(500).json({
                success: false,
                message: 'Pesapal is not configured. Please set PESAPAL_CONSUMER_KEY and PESAPAL_CONSUMER_SECRET.',
            });
            return;
        }

        const ref = `OGERA-${Date.now()}-${(user?.user_id || 'guest').slice(0, 10)}`;
        const merchantReference = ref.replace(/[^a-zA-Z0-9\-_.:]/g, '').slice(0, 50);
        // const notificationId = process.env.PESAPAL_IPN_ID || '';
        const notificationId = await pesapalService.registerIPN();

        if (!notificationId) {
            res.status(400).json({
                success: false,
                message:
                    'PESAPAL_IPN_ID not configured. Call POST /api/payments/register-ipn first, then add the returned ipn_id to .env',
            });
            return;
        }

        const billingAddress = {
            email_address: req.body.email || 'customer@ogera.com',
            phone_number: req.body.phone || '0700000000',
            country_code: req.body.country_code || 'KE',
            first_name: req.body.first_name || 'Customer',
            last_name: req.body.last_name || 'User',
            line_1: req.body.line_1 || 'P.O Box 00100',
            city: req.body.city || 'Nairobi',
            zip_code: req.body.zip_code || '00100',
        };

        const result = await pesapalService.submitOrder(
            parseFloat(amount),
            currency,
            description || 'Ogera Platform Payment',
            merchantReference,
            billingAddress,
            notificationId
        );

        res.json({
            success: true,
            data: {
                redirect_url: result.redirect_url,
                order_tracking_id: result.order_tracking_id,
                merchant_reference: result.merchant_reference,
            },
        });
    } catch (error: unknown) {
        const err = error as Error;
        logger.error('Pesapal submit order error:', err.message, err);
        res.status(500).json({
            success: false,
            message: err.message || 'Failed to create payment order',
        });
    }
}

/**
 * Get transaction status from Pesapal
 */
export async function getPaymentStatus(req: Request, res: Response): Promise<void> {
    try {
        const { orderTrackingId } = req.params;

        if (!orderTrackingId) {
            res.status(400).json({
                success: false,
                message: 'Order tracking ID is required',
            });
            return;
        }

        const result = await pesapalService.getTransactionStatus(orderTrackingId as string);

        res.json({
            success: true,
            data: result,
        });
    } catch (error: unknown) {
        const err = error as Error;
        logger.error('Pesapal get status error:', err);
        res.status(500).json({
            success: false,
            message: err.message || 'Failed to get transaction status',
        });
    }
}

/**
 * Register IPN URL with Pesapal (call once to get ipn_id, then add to .env as PESAPAL_IPN_ID)
 */
export async function registerIPN(req: Request, res: Response): Promise<void> {
    try {
        const ipnId = await pesapalService.registerIPN();

        res.json({
            success: true,
            data: {
                ipn_id: ipnId,
                message: 'Add PESAPAL_IPN_ID=' + ipnId + ' to your .env file',
            },
        });
    } catch (error: unknown) {
        const err = error as Error;
        logger.error('Pesapal register IPN error:', err);
        res.status(500).json({
            success: false,
            message: err.message || 'Failed to register IPN URL',
        });
    }
}

/**
 * IPN callback - Pesapal calls this when payment status changes
 * Must be publicly accessible (no auth)
 */
export async function ipnCallback(req: Request, res: Response): Promise<void> {
    try {
        const { OrderTrackingId, OrderMerchantReference, OrderNotificationType } =
            req.query;

        logger.info('Pesapal IPN received:', {
            OrderTrackingId,
            OrderMerchantReference,
            OrderNotificationType,
        });

        if (OrderNotificationType === 'IPNCHANGE' && OrderTrackingId) {
            const status = await pesapalService.getTransactionStatus(
                OrderTrackingId as string
            );
            logger.info('Payment status update:', status);
            // TODO: Update your database with payment status
        }

        res.status(200).json({ message: 'IPN received' });
    } catch (error: unknown) {
        const err = error as Error;
        logger.error('Pesapal IPN callback error:', err);
        res.status(200).json({ message: 'IPN received' }); // Always return 200 to Pesapal
    }
}
