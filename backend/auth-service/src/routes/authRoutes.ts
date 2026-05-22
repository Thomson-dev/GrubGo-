import { Router } from 'express';
import { register, verifyOtp, login, refresh, logout, resendOtp, getMe } from '../controllers/authController';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { registerSchema, verifyOtpSchema, loginSchema, refreshSchema, emailSchema } from '../schemas/authSchemas';

const router = Router();

router.post('/register',    validate(registerSchema),  register);
router.post('/verify-otp',  validate(verifyOtpSchema), verifyOtp);
router.post('/resend-otp',  validate(emailSchema),     resendOtp);
router.post('/login',       validate(loginSchema),     login);
router.post('/refresh',     validate(refreshSchema),   refresh);
router.post('/logout',      logout);
router.get('/me',           protect,                   getMe);

export default router;
