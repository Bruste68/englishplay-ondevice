import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

/**
 * Google Play 결제 영수증 검증 함수
 * @param productId - 상품 ID (Google Play Console에 등록된 ID)
 * @param purchaseToken - 구매 시 수신한 토큰
 * @returns 검증된 응답 데이터
 */
export async function verifyAndroidPurchase(productId: string, purchaseToken: string) {
  const auth = new JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/androidpublisher'],
  });

  const androidpublisher = google.androidpublisher({ version: 'v3', auth });

  const packageName = 'com.samspeak'; // ✅ 실제 앱 패키지명으로 수정하세요

  const response = await androidpublisher.purchases.products.get({
    packageName,
    productId,
    token: purchaseToken,
  });

  return response.data;
}
