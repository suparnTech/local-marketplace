// Backend Razorpay integration
import Razorpay from 'razorpay';

export const razorpay = new Razorpay({
    key_id: 'rzp_test_RtpEreXs4KGGnf',
    key_secret: '34XAlABMF7a15GYlzWm5iAMr',
});

export interface CreateOrderParams {
    amount: number; // in paise (₹100 = 10000 paise)
    currency?: string;
    receipt?: string;
    notes?: Record<string, any>;
}

export async function createRazorpayOrder(params: CreateOrderParams) {
    try {
        const order = await razorpay.orders.create({
            amount: params.amount,
            currency: params.currency || 'INR',
            receipt: params.receipt || `receipt_${Date.now()}`,
            notes: params.notes || {},
        });
        return order;
    } catch (error) {
        console.error('Razorpay order creation error:', error);
        throw error;
    }
}

export async function verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string
): Promise<boolean> {
    const crypto = require('crypto');
    const text = `${orderId}|${paymentId}`;
    const generated_signature = crypto
        .createHmac('sha256', '34XAlABMF7a15GYlzWm5iAMr')
        .update(text)
        .digest('hex');

    return generated_signature === signature;
}
