import { Request, Response } from 'express';
import User from '../models/user.model';

export const findAccount = async (req: Request, res: Response): Promise<void> => {
  console.log("📡 /api/find-account 호출됨", req.body);
  const { name, birth } = req.body;

  if (!name || !birth) {
    res.status(400).json({ error: '이름과 생년월일은 필수입니다.' });
    return;
  }

  try {
    const user = await User.findOne({ where: { name, birth } });

    if (!user) {
      res.status(404).json({ error: '일치하는 사용자 없음' });
      return;
    }

    res.json({ id: user.userId });
  } catch (error: any) {
    console.error('❌ 계정 찾기 오류:', error.message);
    res.status(500).json({ error: '서버 오류', details: error.message });
  }
};
