import express from 'express';
import bcrypt from 'bcrypt';
import User from '../models/user.model';

const router = express.Router();

router.post('/users', async (req, res) => {
  console.log('=== /users 요청 데이터 ===', req.body);
  const {
    userId,
    name,
    birth,
    password,
    email,
    nickname,
    provider,
  } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      userId,
      name,
      birth,
      password: hashedPassword,
      email,
      nickname,
      provider: provider || 'local',
    });

    res.json(user);
  } catch (err: any) {
    console.error('❌ /users 에러 상세:', {
      message: err.message,
      stack: err.stack,
      sql: err.sql
    });
    res.status(400).json({ error: err.message });
  }
});

export default router;
