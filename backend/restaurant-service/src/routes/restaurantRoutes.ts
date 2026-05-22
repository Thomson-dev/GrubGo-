import { Router } from 'express';
import { protect, authorizeRoles } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  restaurantProfileSchema, categorySchema, menuItemSchema,
  placeOrderSchema, addToCartSchema, updateCartItemSchema, addressSchema,
} from '../schemas/index';
import { createProfile, getMyProfile, updateProfile, listRestaurants, getRestaurant } from '../controllers/restaurantController';
import { createCategory, getCategories, deleteCategory, getPublicCategories } from '../controllers/categoryController';
import { createMenuItem, getMyMenu, updateMenuItem, deleteMenuItem, getPublicMenu } from '../controllers/menuController';
import { placeOrder, getMyOrders, getRestaurantOrders, updateOrderStatus } from '../controllers/orderController';
import { getCart, addToCart, updateCartItem, clearCart } from '../controllers/cartController';
import { getAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress } from '../controllers/addressController';

const router = Router();

// --- Public ---
router.get('/restaurants',                  listRestaurants);
router.get('/restaurants/:id',              getRestaurant);
router.get('/restaurants/:id/categories',   getPublicCategories);
router.get('/restaurants/:id/menu',         getPublicMenu);

// --- Restaurant owner ---
router.post('/restaurant/profile',  protect, authorizeRoles('restaurant'), validate(restaurantProfileSchema), createProfile);
router.get('/restaurant/profile',   protect, authorizeRoles('restaurant'), getMyProfile);
router.put('/restaurant/profile',   protect, authorizeRoles('restaurant'), validate(restaurantProfileSchema.partial()), updateProfile);

router.post('/restaurant/categories',       protect, authorizeRoles('restaurant'), validate(categorySchema),             createCategory);
router.get('/restaurant/categories',        protect, authorizeRoles('restaurant'),                                       getCategories);
router.delete('/restaurant/categories/:id', protect, authorizeRoles('restaurant'),                                       deleteCategory);

router.post('/restaurant/menu',       protect, authorizeRoles('restaurant'), validate(menuItemSchema),             createMenuItem);
router.get('/restaurant/menu',        protect, authorizeRoles('restaurant'),                                        getMyMenu);
router.put('/restaurant/menu/:id',    protect, authorizeRoles('restaurant'), validate(menuItemSchema.partial()),   updateMenuItem);
router.delete('/restaurant/menu/:id', protect, authorizeRoles('restaurant'),                                        deleteMenuItem);

router.get('/restaurant/orders',                protect, authorizeRoles('restaurant'), getRestaurantOrders);
router.put('/restaurant/orders/:id/status',     protect, authorizeRoles('restaurant'), updateOrderStatus);

// --- Customer ---
router.post('/orders',    protect, authorizeRoles('customer'), validate(placeOrderSchema),       placeOrder);
router.get('/orders/my',  protect, authorizeRoles('customer'),                                    getMyOrders);

router.get('/cart',                    protect, authorizeRoles('customer'),                                   getCart);
router.post('/cart/add',               protect, authorizeRoles('customer'), validate(addToCartSchema),        addToCart);
router.patch('/cart/item/:menuItemId', protect, authorizeRoles('customer'), validate(updateCartItemSchema),   updateCartItem);
router.delete('/cart',                 protect, authorizeRoles('customer'),                                   clearCart);

router.get('/addresses',               protect, authorizeRoles('customer'),                              getAddresses);
router.post('/addresses',              protect, authorizeRoles('customer'), validate(addressSchema),     addAddress);
router.put('/addresses/:id',           protect, authorizeRoles('customer'), validate(addressSchema.partial()), updateAddress);
router.delete('/addresses/:id',        protect, authorizeRoles('customer'),                              deleteAddress);
router.patch('/addresses/:id/default', protect, authorizeRoles('customer'),                              setDefaultAddress);

export default router;
