// server.ts
import dotenv from 'dotenv';
import path from 'path';

// ✅ .env 경로 명시
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import app from './app';
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});
