import { Request, Response } from 'express';
import Stripe from 'stripe';
import axios from 'axios';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

// POST /api/payment/stripe/create-intent
// Body: { amount: number (in USD cents), orderId: string, currency?: string }
export const createPaymentIntent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount, orderId, currency = 'usd' } = req.body as {
      amount: number;
      orderId: string;
      currency?: string;
    };

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // convert dollars → cents
      currency,
      metadata: { orderId },
    });

    // clientSecret is sent to the Flutter app which passes it to Stripe SDK to complete payment
    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create payment intent', error: (err as Error).message });
  }
};

// POST /api/payment/stripe/webhook
// Stripe calls this URL automatically when a payment succeeds/fails
// Must be registered in your Stripe dashboard under Webhooks
export const stripeWebhook = async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;

  try {
    // req.body must be the raw Buffer here — see index.ts for the raw body setup
    event = stripe.webhooks.constructEvent(
      req.body as Buffer,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err) {
    res.status(400).json({ message: `Webhook signature verification failed: ${(err as Error).message}` });
    return;
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const intent = event.data.object as Stripe.PaymentIntent;
      if (intent.metadata.orderId) {
        await axios.patch(
          `${process.env.RESTAURANT_SERVICE_URL}/internal/orders/${intent.metadata.orderId}/mark-paid`,
          { paymentId: intent.id, paymentMethod: 'stripe' },
          { headers: { 'x-internal-key': process.env.INTERNAL_API_KEY } }
        );
      }
      break;
    }
    case 'payment_intent.payment_failed': {
      const intent = event.data.object as Stripe.PaymentIntent;
      console.log(`Payment failed for order ${intent.metadata.orderId}`);
      break;
    }
  }

  res.status(200).json({ received: true });
};
