import { Router } from 'express';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { paystackInitSchema, paystackVerifySchema, stripeIntentSchema } from '../schemas/index';
import { initializePayment, verifyPayment, paystackWebhook } from '../controllers/paystackController';
import { createPaymentIntent, stripeWebhook } from '../controllers/stripeController';

const router = Router();

router.post('/paystack/initialize', protect, validate(paystackInitSchema), initializePayment);
router.post('/paystack/verify',     protect, validate(paystackVerifySchema), verifyPayment);
router.post('/paystack/webhook',    paystackWebhook);

router.post('/stripe/create-intent', protect, validate(stripeIntentSchema), createPaymentIntent);
router.post('/stripe/webhook',       stripeWebhook);

export default router;
