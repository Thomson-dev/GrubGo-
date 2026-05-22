import { Request, Response } from 'express';
import axios from 'axios';

const PAYSTACK_BASE = 'https://api.paystack.co';

const paystackHeaders = () => ({
  Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
  'Content-Type': 'application/json',
});

// POST /api/payment/paystack/initialize
// Body: { email: string, amount: number (in NGN naira), orderId: string }
// Paystack needs the customer email to identify the transaction
export const initializePayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, amount, orderId } = req.body as {
      email: string;
      amount: number;
      orderId: string;
    };

    const response = await axios.post(
      `${PAYSTACK_BASE}/transaction/initialize`,
      {
        email,
        amount: Math.round(amount * 100), // convert naira → kobo
        metadata: { orderId },
        callback_url: `${process.env.FRONTEND_URL}/payment/callback`,
      },
      { headers: paystackHeaders() }
    );

    const { authorization_url, access_code, reference } = response.data.data;

    res.status(200).json({
      authorizationUrl: authorization_url, // redirect user here (web) or use Flutter Paystack package
      accessCode: access_code,             // used by Paystack Flutter SDK
      reference,                           // save this — you need it to verify later
      publicKey: process.env.PAYSTACK_PUBLIC_KEY,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to initialize payment', error: (err as Error).message });
  }
};

// POST /api/payment/paystack/verify
// Body: { reference: string }
// Call this after user completes payment to confirm it actually succeeded
export const verifyPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { reference } = req.body as { reference: string };

    if (!reference) {
      res.status(400).json({ message: 'Payment reference is required' });
      return;
    }

    const response = await axios.get(
      `${PAYSTACK_BASE}/transaction/verify/${reference}`,
      { headers: paystackHeaders() }
    );

    const { status, amount, metadata } = response.data.data;

    if (status !== 'success') {
      res.status(400).json({ message: 'Payment not successful', status });
      return;
    }

    res.status(200).json({
      message: 'Payment verified',
      reference,
      amountPaid: amount / 100, // convert kobo → naira for response
      orderId: metadata?.orderId,
    });
  } catch (err) {
    res.status(500).json({ message: 'Verification failed', error: (err as Error).message });
  }
};

// POST /api/payment/paystack/webhook
// Paystack calls this when payment events happen (charge.success, transfer.success, etc.)
// Register this URL in your Paystack dashboard under Settings → Webhooks
export const paystackWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const crypto = await import('crypto');
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY as string)
      .update(JSON.stringify(req.body))
      .digest('hex');

    // Reject if signature doesn't match — prevents spoofed webhook calls
    if (hash !== req.headers['x-paystack-signature']) {
      res.status(400).json({ message: 'Invalid webhook signature' });
      return;
    }

    const { event, data } = req.body as {
      event: string;
      data: { reference: string; metadata: { orderId: string }; status: string };
    };

    if (event === 'charge.success' && data.metadata?.orderId) {
      await axios.patch(
        `${process.env.RESTAURANT_SERVICE_URL}/internal/orders/${data.metadata.orderId}/mark-paid`,
        { paymentId: data.reference, paymentMethod: 'paystack' },
        { headers: { 'x-internal-key': process.env.INTERNAL_API_KEY } }
      );
    }

    res.status(200).json({ received: true });
  } catch (err) {
    res.status(500).json({ message: 'Webhook error', error: (err as Error).message });
  }
};
