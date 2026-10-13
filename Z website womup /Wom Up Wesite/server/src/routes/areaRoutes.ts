import { Router } from 'express';
import { getAreas } from '../controllers/productController.js';

const router = Router();

router.get('/', getAreas);

export default router;
