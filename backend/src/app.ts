import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import adminRoutes from './routes/admin';
import contentRoutes from './routes/content';
import publicRoutes from './routes/public';
import accountRoutes from './routes/account.routes';
import whisperRoute from './routes/whisper.route';
import { verifyToken } from './middlewares/verifyToken';
import adminOnly from './middlewares/adminOnly';
import purchaseRoutes from './routes/purchase.routes';

const app = express();

// ✅ 미들웨어
app.use(cors({
  origin: ['http://localhost:3000', 'https://samspeakgo.com'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ API 라우터 등록
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api/admin', verifyToken, adminOnly, adminRoutes);
app.use('/api/admin', contentRoutes);
app.use('/api', publicRoutes);
app.use('/api', accountRoutes);
app.use('/api/whisper', whisperRoute);
app.use('/api', purchaseRoutes);

// ✅ 정적 파일 경로
const publicPath = path.resolve(__dirname, '../public');
console.log('📁 Static path used:', publicPath);
app.use(express.static(publicPath));

// ✅ 직접 HTML 요청 처리
const htmlPattern = /^\/.*\.html$/;
app.get(htmlPattern, (req, res, next) => {
  const filePath = path.join(publicPath, req.path);
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  next();
});

// ✅ SPA fallback
app.get(/^\/(?!api|health).*/, (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// ✅ 상태 확인
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// ✅ 404 처리
app.use((req, res) => {
  console.warn('⚠️ 404 - 미처리 경로:', req.method, req.originalUrl);
  res.status(404).json({ error: 'Not found' });
});

// ✅ 전역 에러 핸들러
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ✅ index.html 첫 줄 로그
const indexFilePath = path.join(publicPath, 'index.html');
fs.readFile(indexFilePath, 'utf-8', (err, content) => {
  if (err) {
    console.error('❌ index.html 확인 실패:', err.message);
  } else {
    const firstLine = content.split('\n')[0];
    console.log(`📄 index.html 첫 줄: ${firstLine}`);
  }
  printRouteList();
});

function printRouteList() {
  console.log('\n🛠️ 등록된 라우트 경로 목록:');
  const stack = (app as any)._router?.stack;
  if (!stack) {
    console.log('❌ _router.stack이 아직 준비되지 않았습니다.');
    return;
  }
  stack.forEach((middleware: any) => {
    if (middleware.route) {
      console.log(`🔹 ${Object.keys(middleware.route.methods).join(', ').toUpperCase()} ${middleware.route.path}`);
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach((handler: any) => {
        if (handler.route) {
          console.log(`🔸 ${Object.keys(handler.route.methods).join(', ').toUpperCase()} ${handler.route.path}`);
        }
      });
    }
  });
}

export default app;
