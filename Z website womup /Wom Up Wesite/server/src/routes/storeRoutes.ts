import { Router } from 'express';
import { getStores, getStoreById } from '../controllers/storeController.js';

const router = Router();

router.get('/', getStores);
router.get('/:id', getStoreById);

export default router;
