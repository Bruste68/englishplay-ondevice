import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { verifyToken } from '../middlewares/verifyToken';
import adminOnly from '../middlewares/adminOnly';

const router = express.Router();

const uploadPath = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadPath),
  filename: (_req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({ storage });

router.post(
  '/content/upload',
  verifyToken,
  adminOnly,
  upload.single('file'),
  (req: Request, res: Response): void => {
    if (!req.file) {
      res.status(400).json({ error: '파일이 없습니다.' });
      return;
    }

    res.status(200).json({ filename: req.file.filename });
  }
);

router.post(
  '/content/activate/:id',
  verifyToken,
  adminOnly,
  (req: Request, res: Response): void => {
    const id = req.params.id;
    console.log('✅ 콘텐츠 활성화 요청됨:', id);
    res.status(200).json({ success: true, id });
  }
);

router.delete(
  '/content/:id',
  verifyToken,
  adminOnly,
  (req: Request, res: Response): void => {
    const id = req.params.id;
    console.log('🗑️ 콘텐츠 삭제 요청됨:', id);
    res.status(200).json({ success: true, id });
  }
);

export default router;
