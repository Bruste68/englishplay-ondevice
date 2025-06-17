import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

export const downloadWhisperModel = (req: Request, res: Response): void => {
  let modelName = 'ggml-small.bin';

  if (typeof req.query.model === 'string') {
    modelName = req.query.model;
  }

  const modelPath = path.resolve('/var/www/samspeakgo.com/models', modelName);

  if (!fs.existsSync(modelPath)) {
    console.error(`❌ 모델 파일 없음: ${modelPath}`);
    res.status(404).json({ error: 'Model not found' });
    return;
  }

  res.download(modelPath, err => {
    if (err) {
      console.error('❌ Whisper 모델 다운로드 실패:', err.message);
      res.status(500).json({ error: 'Failed to download model' });
    }
  });
};
