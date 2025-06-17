import express from 'express';
import bcrypt from 'bcrypt';
import User from '../models/user.model';

const router = express.Router();

router.post('/users', async (req, res) => {
  const {
    user_id,
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
      user_id,
      name,
      birth,
      password: hashedPassword,
      email: email?.trim() || null, // ✅ 여기 핵심 수정
      nickname,
      provider: provider || 'local',
    });

    res.json(user);
  } catch (err: any) {
    console.error("🔥 사용자 생성 실패:", err);
    res.status(400).json({ error: err.message });
  }
});

export default router;
