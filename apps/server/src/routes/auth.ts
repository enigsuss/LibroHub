import { PrismaClient } from '@prisma/client';
import { Router, Request, Response } from 'express';
import axios from 'axios';
import 'dotenv/config';

const prisma = new PrismaClient();
const router = Router();

router.post('/callback', async (req: Request, res: Response) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'No authorization code provided' });
  }

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

    const userInfoResponse = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const providerId = userInfoResponse.data.id;
    const nickname = userInfoResponse.data.kakao_account.profile.nickname;

    const user = await prisma.users.upsert({
      where: { provider_id: String(providerId) },
      update: {
        refresh_token: refresh_token,
        nickname,
      },
      create: {
        provider: 'kakao',
        provider_id: String(providerId),
        refresh_token,
        nickname,
      },
    });

    res.json({
      message: 'Access Token received successfully',
      access_token,
      user_id: user.id,
    });
  } catch (error) {
    console.error('Token issuance failed', error);
    res.status(500).json({ error: 'Token issuance failed' });
  }
});

export default router;
