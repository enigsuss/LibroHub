import React from 'react';

type SiteLoginControlProps = {
  name: string;
  isLoggedIn: boolean | null;
  onLogin: () => void;
  onLogout: () => void;
};

export function SiteLoginControl({ name, isLoggedIn, onLogin, onLogout }: SiteLoginControlProps) {
  if (isLoggedIn === null) return null;

  return isLoggedIn ? (
    <button onClick={onLogout}>{name} 로그아웃</button>
  ) : (
    <button onClick={onLogin}>{name} 로그인</button>
  );
}
