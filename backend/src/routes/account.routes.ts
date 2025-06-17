import { Router } from 'express';
import { findAccount } from '../controllers/account.controller';

const router = Router();

router.post('/find-account', findAccount); // ✅ 타입 문제 없음

export default router;
