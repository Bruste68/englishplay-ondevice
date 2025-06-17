import express from 'express';
import { verifyPurchase, getPurchaseStatus } from '../controllers/purchase.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = express.Router();

router.post('/purchase/verify', verifyToken, verifyPurchase);
router.get('/purchase/status', verifyToken, getPurchaseStatus);

export default router;
