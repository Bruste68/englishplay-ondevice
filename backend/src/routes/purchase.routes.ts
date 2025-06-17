import express from 'express';
import { verifyPurchase, getPurchaseStatus } from '../controllers/purchase.controller';
import { verifyToken } from '../middlewares/verifyToken';

const router = express.Router();

// ✅ 실제 인앱결제 영수증 검증 라우트
router.post('/verify-receipt', verifyToken, verifyPurchase);

// ✅ 프리미엄 구매 여부 확인 라우트
router.get('/purchase/status', verifyToken, getPurchaseStatus);

export default router;