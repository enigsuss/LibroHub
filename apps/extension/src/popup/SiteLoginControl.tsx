import React from 'react';

type SiteLoginControlProps = {
  name: string;
  isLoggedIn: boolean | null;
  onLogin: () => void;
  onLogout: () => void;
  imageSrc: string;
};

export function SiteLoginControl({
  name,
  isLoggedIn,
  onLogin,
  onLogout,
  imageSrc,
}: SiteLoginControlProps) {
  if (isLoggedIn === null) return null;

  return isLoggedIn ? (
    <>
      <img
        src={imageSrc + '.png'}
        alt={`${name}로그아웃`}
        width={35}
        height={35}
        onClick={onLogout}
        style={{ cursor: 'pointer', borderRadius: '8px', marginRight: '5px' }}
      />
    </>
  ) : (
    <>
      <img
        src={imageSrc + '_off.png'}
        alt={`${name}로그인`}
        width={35}
        height={35}
        onClick={onLogin}
        style={{ cursor: 'pointer', borderRadius: '8px', marginRight: '5px' }}
      />
    </>
  );
}
