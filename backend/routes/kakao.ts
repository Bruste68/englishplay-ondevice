import axios from 'axios';
import express from 'express';

const router = express.Router();

router.post('/kakao-token', async (req, res) => {
  const { code } = req.body;
  const redirectUri = process.env.KAKAO_REDIRECT_URI!;
  const restApiKey = process.env.KAKAO_REST_API_KEY!;

  try {
    const tokenRes = await axios.post('https://kauth.kakao.com/oauth/token', null, {
      params: {
        grant_type: 'authorization_code',
        client_id: restApiKey,
        redirect_uri: redirectUri,
        code,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    });

    const tokenData = tokenRes.data as any;
    const accessToken = tokenData.access_token;

    const userRes = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      }
    });

    const userData = userRes.data as any;
    const email =
      userData.kakao_account?.email ||
      userData.properties?.nickname ||
      'unknown';

    res.json({ email });
  } catch (error: any) {
    // ✅ axios 에러 여부 판단을 직접 try-catch로 처리
    const message = error?.response?.data || error?.message || 'Unknown error';
    console.error('Kakao OAuth error:', message);
    res.status(400).json({
      error: 'Kakao login failed',
      detail: message
    });
  }
});

export default router;
