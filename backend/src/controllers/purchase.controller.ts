import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';
import Purchase from '../models/purchase.model';
import User from '../models/user.model';
import { JWT } from 'google-auth-library';

const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL!;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY!.replace(/\n/g, '\n');
const PACKAGE_NAME = 'com.samspeak.pro';

const oAuth2Client = new JWT({
  email: GOOGLE_CLIENT_EMAIL,
  key: GOOGLE_PRIVATE_KEY,
  scopes: ['https://www.googleapis.com/auth/androidpublisher'],
});

export const verifyPurchase = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: '인증되지 않은 사용자입니다.' });
    return;
  }

  const { receiptData, productId } = req.body;
  const userId = (req.user as any).userId;

  if (!receiptData || !productId) {
    res.status(400).json({ message: '필수 항목 누락' });
    return;
  }

  try {
    const token = await oAuth2Client.getAccessToken();
    const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PACKAGE_NAME}/purchases/products/${productId}/tokens/${receiptData}`;

    const result = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token.token}`,
      },
    });

    if (result.data.purchaseState === 0) {
      await Purchase.upsert({
        userId,
        productId,
        receipt: receiptData,
        platform: 'android',
        purchaseTime: new Date(Number(result.data.purchaseTimeMillis)),
      });

      // ✅ 프리미엄 권한 갱신
      const user = await User.findOne({ where: { userId } });
      if (user) {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
        await user.update({ premium_expires_at: expiresAt });
      }

      res.json({ isPaid: true });
      return;
    }

    res.status(400).json({ message: '유효하지 않은 결제 상태' });
  } catch (err) {
    console.error('구매 검증 오류:', err);
    res.status(500).json({ message: '구매 검증 실패' });
  }
};

export const getPurchaseStatus = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: '인증되지 않은 사용자입니다.' });
    return;
  }

  const userId = (req.user as any).userId;

  try {
    const purchase = await Purchase.findOne({ where: { userId } });

    if (!purchase) {
      res.json({ isPaid: false });
      return;
    }

    const product = purchase.get({ plain: true }) as { productId: string };
    res.json({ isPaid: true, productId: product.productId });
  } catch (err) {
    console.error('구매 상태 조회 오류:', err);
    res.status(500).json({ message: '조회 실패' });
  }
};
