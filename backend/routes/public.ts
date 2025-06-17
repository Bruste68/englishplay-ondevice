import express from 'express';
import Content from '../models/Content';

const router = express.Router();

// ✅ 최신 콘텐츠 1개 반환 API
router.get('/content/latest', async (req, res): Promise<void> => {
  try {
    const latest = await Content.findOne({
      order: [['uploadedAt', 'DESC']],
    });

    if (!latest) {
      res.status(404).json({ message: '콘텐츠 없음' });
      return;
    }

    res.json({
      filename: latest.filename,
      url: latest.url,
      uploadedAt: latest.uploadedAt,
    });
  } catch (err) {
    console.error('최신 콘텐츠 조회 실패:', err);
    res.status(500).json({ message: '오류 발생' });
  }
});

export default router;
