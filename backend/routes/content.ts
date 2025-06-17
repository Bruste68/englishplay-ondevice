import express, { Request, Response } from 'express';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { verifyToken } from '../middlewares/verifyToken';
import adminOnly from '../middlewares/adminOnly';
import Content from '../models/Content';
import { Express } from 'express';

const router = express.Router();

// ✅ 저장 경로 + 파일명
const storage = multer.diskStorage({
  destination: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ): void => {
    const contentDir = path.resolve(__dirname, '../../public/content');
    if (!fs.existsSync(contentDir)) fs.mkdirSync(contentDir, { recursive: true });
    cb(null, contentDir);
  },
  filename: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
  ): void => {
    const datePrefix = new Date().toISOString().split('T')[0];
    const uniqueName = `${datePrefix}_${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

/**
 * ✅ 업로드
 */
router.post(
  '/content/upload',
  verifyToken,
  adminOnly,
  upload.single('file'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const file = req.file;
      const user = req.user as any;

      if (!file) {
        res.status(400).json({ success: false, message: '파일이 없습니다.' });
        return;
      }

      await Content.create({
        filename: file.filename,
        url: `/content/${file.filename}`,
        uploadedAt: new Date(),
        uploadedBy: user.email,
      });

      res.json({ success: true, message: '업로드 완료', filename: file.filename });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: '업로드 실패' });
    }
  }
);

/**
 * ✅ 콘텐츠 목록 조회
 */
router.get(
  '/content/list',
  verifyToken,
  adminOnly,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const contents = await Content.findAll({ order: [['uploadedAt', 'DESC']] });
      res.json(contents);
    } catch (err) {
      res.status(500).json({ message: '목록 조회 오류' });
    }
  }
);

/**
 * ✅ 콘텐츠 활성화
 */
router.post(
  '/content/activate/:id',
  verifyToken,
  adminOnly,
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
      await Content.update({ is_active: false }, { where: {} });
      const [updated] = await Content.update({ is_active: true }, { where: { id } });
      if (updated === 0) {
        res.status(404).json({ success: false, message: 'ID 없음' });
        return;
      }
      res.json({ success: true, message: '활성화 완료' });
    } catch (err) {
      res.status(500).json({ message: '활성화 실패' });
    }
  }
);

/**
 * ✅ 콘텐츠 삭제
 */
router.delete(
  '/content/:id',
  verifyToken,
  adminOnly,
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
      const content = await Content.findByPk(id);
      if (!content) {
        res.status(404).json({ message: '콘텐츠 없음' });
        return;
      }

      const filePath = path.resolve(__dirname, `../../public${content.url}`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      await content.destroy();
      res.json({ success: true, message: '삭제 완료' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: '삭제 실패' });
    }
  }
);

export default router;
