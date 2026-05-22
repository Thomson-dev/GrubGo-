import { Router } from 'express';
import { protectAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { adminLoginSchema, adminSeedSchema, verifyEntitySchema } from '../schemas/index';
import { seedAdmin, login } from '../controllers/authController';
import { getAllRestaurants, verifyRestaurant, getAllOrders } from '../controllers/restaurantController';
import { getAllRiders, verifyRider } from '../controllers/riderController';
import { getDashboardStats } from '../controllers/dashboardController';

const router = Router();

router.post('/seed',  validate(adminSeedSchema),  seedAdmin);
router.post('/login', validate(adminLoginSchema),  login);

router.use(protectAdmin);

router.get('/stats',                              getDashboardStats);
router.get('/restaurants',                        getAllRestaurants);
router.patch('/restaurants/:id/verify', validate(verifyEntitySchema), verifyRestaurant);
router.get('/orders',                             getAllOrders);
router.get('/riders',                             getAllRiders);
router.patch('/riders/:id/verify',      validate(verifyEntitySchema), verifyRider);

export default router;
