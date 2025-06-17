// utils/paymentLogger.ts
import fs from 'fs';
import path from 'path';

const logFilePath = path.resolve(__dirname, '../../logs/payment.log');

export const logPayment = (log: Record<string, any>) => {
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] ${JSON.stringify(log)}\n`;

  try {
    fs.appendFileSync(logFilePath, entry, { encoding: 'utf8' });
  } catch (err) {
    console.error('💥 결제 로그 저장 실패:', err);
  }
};
