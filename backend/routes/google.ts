import express from 'express';
import axios from 'axios';

const router = express.Router();

router.post('/google-token', async (req, res) => {
  const { token } = req.body;

  try {
    const userRes = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const userData = userRes.data as any; // ✅ 타입 단언으로 해결
    const email = userData.email || 'unknown';

    res.json({ email });
  } catch (error: any) {
    // ✅ 타입 가드 없이 직접 처리
    const msg = error?.response?.data || error?.message || 'Google login error';
    console.error('Google OAuth error:', msg);

    res.status(400).json({
      error: 'Google login failed',
      detail: msg
    });
  }
});

export default router;
