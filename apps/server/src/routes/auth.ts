import { Router, Request, Response } from 'express';
import axios from 'axios';
import 'dotenv/config';

const router = Router();

router.post('/callback', async (req: Request, res: Response) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'No authorization code provided' });
  }
  console.log('Received auth code:', code);

  try {
    const tokenResponse = await axios.post(
      'https://kauth.kakao.com/oauth/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.KAKAO_REST_API_KEY!,
        redirect_uri: process.env.KAKAO_REDIRECT_URI!,
        code,
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    const { access_token, refresh_token } = tokenResponse.data;
    // todo : 로그 제거 예정
    console.log('Access Token:', access_token);
    console.log('Refresh Token:', refresh_token);

    res.json({ message: 'Access Token received successfully', access_token });
  } catch (error) {
    console.error('Token issuance failed', error);
    res.status(500).json({ error: 'Token issuance failed' });
  }
});

export default router;
