import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'elibrary.kyobobook.co.kr',
        pathname: '/upload/**',
      },
      {
        protocol: 'https',
        hostname: 'image.aladin.co.kr',
        pathname: '/product/**',
      },
      {
        protocol: 'https',
        hostname: 'contents.kyobobook.co.kr',
        pathname: '/sih/**',
      },
      {
        protocol: 'https',
        hostname: 'img.ridicdn.net',
        pathname: '/cover/**',
      },
    ],
  },
  /* config options here */
};

export default nextConfig;
