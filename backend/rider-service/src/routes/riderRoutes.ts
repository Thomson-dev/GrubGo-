import { Router } from 'express';
import { protect, authorizeRoles } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { riderProfileSchema, riderStatusSchema, deliveryStatusSchema } from '../schemas/index';
import { createProfile, getMyProfile, updateProfile, updateStatus } from '../controllers/riderController';
import { getAvailableOrders, acceptOrder, updateDeliveryStatus } from '../controllers/orderController';

const router = Router();

router.use(protect, authorizeRoles('rider'));

router.post('/profile',  validate(riderProfileSchema),          createProfile);
router.get('/profile',                                           getMyProfile);
router.put('/profile',   validate(riderProfileSchema.partial()), updateProfile);
router.patch('/status',  validate(riderStatusSchema),           updateStatus);

router.get('/orders/available',          getAvailableOrders);
router.post('/orders/:id/accept',        acceptOrder);
router.patch('/orders/:id/status',  validate(deliveryStatusSchema), updateDeliveryStatus);

export default router;
