import express, { Request, Response } from 'express';
import User from '../models/user.model';
import { verifyToken } from '../middlewares/verifyToken';
import adminOnly from '../middlewares/adminOnly';
import Log from '../models/Log';
import Content from '../models/Content';

const router = express.Router();

interface CustomRequest extends Request {
  user?: {
    email?: string;
    [key: string]: any;
  };
}

router.get('/users', verifyToken, adminOnly, async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'email', 'name', 'provider', 'is_admin', 'createdAt']
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "사용자 목록 조회 실패" });
  }
});

router.delete('/users/:id', verifyToken, adminOnly, async (req: CustomRequest, res: Response): Promise<void> => {
  try {
    const result = await User.destroy({ where: { userId: req.params.id } }); // ✅ 수정

    await Log.create({
      message: `관리자 ${req.user?.email ?? '알 수 없음'} 님이 사용자 ${req.params.id} 을(를) 삭제했습니다.`
    });

    res.json({ deleted: result });
  } catch (error) {
    res.status(500).json({ message: "삭제 실패" });
  }
});

router.get('/stats', verifyToken, adminOnly, async (req: Request, res: Response): Promise<void> => {
  try {
    const totalUsers = await User.count();
    const adminUsers = await User.count({ where: { is_admin: true } });
    res.json({ totalUsers, adminUsers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '통계 조회 실패' });
  }
});

router.get('/logs', verifyToken, adminOnly, async (req: Request, res: Response): Promise<void> => {
  try {
    const logs = await Log.findAll({
      order: [['createdAt', 'DESC']],
      limit: 20,
    });
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '로그 조회 실패' });
  }
});

router.get('/content/list', verifyToken, adminOnly, async (req: Request, res: Response): Promise<void> => {
  try {
    const contents = await Content.findAll({
      order: [['uploadedAt', 'DESC']]
    });

    res.json(contents);
  } catch (err) {
    console.error('콘텐츠 목록 조회 실패:', err);
    res.status(500).json({ message: '목록 조회 중 오류 발생' });
  }
});

export default router;
