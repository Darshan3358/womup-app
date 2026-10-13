import { Router } from 'express';
import { createOrder, getOrderById, getAllOrders } from '../controllers/orderController.js';

const router = Router();

router.get('/', getAllOrders);
router.post('/', createOrder);
router.get('/:id', getOrderById);

export default router;
