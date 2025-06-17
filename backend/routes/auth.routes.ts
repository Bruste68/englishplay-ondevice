import express from 'express';
import { signup, login, me, checkId } from '../controllers/auth.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', verifyToken, me);
router.post('/check-email', checkId);

export default router;