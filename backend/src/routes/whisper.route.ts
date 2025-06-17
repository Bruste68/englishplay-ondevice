// whisper.route.ts
import { Router } from 'express';
import { downloadWhisperModel } from '../controllers/whisper.controller';

const router = Router();
router.get('/download-model', downloadWhisperModel);
export default router;
