import express from 'express';
import cors from 'cors';
import passport from 'passport';
import path from 'path';
import fs from 'fs';

import authRoutes from './routes/auth.routes';
import oauthRoutes from './routes/oauth.routes';
import kakaoRoute from './routes/kakao';
import googleRoute from './routes/google';
import naverRoute from './routes/naver';
import yahooRoute from './routes/yahoo';
import lineRoute from './routes/line';
import userRoutes from './routes/user.routes';
import adminRoutes from './routes/admin';
import contentRoutes from './routes/content';
import publicRoutes from './routes/public';

import { verifyToken } from './middlewares/auth.middleware';
import adminOnly from './middlewares/adminOnly';

const app = express();

// ✅ 미들웨어
app.use(cors({
  origin: ['http://localhost:3000', 'https://samspeakgo.com'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// ✅ 정적 파일 경로 설정
const publicPath = path.resolve(__dirname, '../../public');
console.log('📁 Static path used:', publicPath);
app.use(express.static(publicPath));

// ✅ API 라우터 등록
app.use('/api', authRoutes);
app.use('/api/oauth', oauthRoutes);
app.use('/', kakaoRoute);
app.use('/', googleRoute);
app.use('/', naverRoute);
app.use('/', yahooRoute);
app.use('/', lineRoute);
app.use('/api', userRoutes);
app.use('/api/admin', verifyToken, adminOnly, adminRoutes);
app.use('/api/admin', contentRoutes);
app.use('/api', publicRoutes);

// ✅ HTML 직접 요청 (정규표현식 기반 안전한 처리)
const htmlPattern = /^\/.*\.html$/;
app.get(htmlPattern, (req, res, next) => {
  const filePath = path.join(publicPath, req.path);
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  next();
});

// ✅ SPA fallback
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// ✅ 상태 확인 API
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// ✅ 404 처리
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ✅ 전역 에러 핸들러
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const indexFilePath = path.join(publicPath, 'index.html');
fs.readFile(indexFilePath, 'utf-8', (err, content) => {
  if (err) {
    console.error('❌ index.html 확인 실패:', err.message);
  } else {
    const firstLine = content.split('\n')[0];
    console.log(`📄 index.html 첫 줄: ${firstLine}`);
  }
});

export default app;


