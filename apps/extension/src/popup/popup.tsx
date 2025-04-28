import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { accessToken } = await chrome.storage.local.get('accessToken');
      setIsLoggedIn(!!accessToken);
    })();
  }, []);

  const handleLogin = async () => {
    const REDIRECT_URI = chrome.identity.getRedirectURL();
    const REST_API_KEY = import.meta.env.VITE_REST_API_KEY;
    if (!REST_API_KEY) {
      console.error('REST_API_KEY가 설정되지 않았습니다.');
      alert('환경 변수 설정 오류');
      return;
    }
    const authUrl = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${REST_API_KEY}&redirect_uri=${REDIRECT_URI}
`;

    try {
      const resultUrl = await new Promise<string>((resolve, reject) => {
        chrome.identity.launchWebAuthFlow(
          {
            url: authUrl,
            interactive: true,
          },
          (redirectedTo) => {
            if (chrome.runtime.lastError || !redirectedTo) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(redirectedTo);
            }
          }
        );
      });

      const url = new URL(resultUrl);
      const hashParams = new URLSearchParams(url.hash.substring(1)); // # 뒤를 파싱
      const accessToken = hashParams.get('access_token');

      if (accessToken) {
        await chrome.storage.local.set({ accessToken });
        setIsLoggedIn(true);
      } else {
        alert('로그인 실패: access_token이 없습니다.');
      }
    } catch (error) {
      console.error('OAuth 로그인 실패', error);
    }
  };

  const handleLogout = async () => {
    await chrome.storage.local.remove('accessToken');
    setIsLoggedIn(false);
  };

  if (isLoggedIn === null) {
    return <div>로딩 중...</div>;
  }

  return (
    <div style={{ padding: 20, minWidth: 250 }}>
      {isLoggedIn ? (
        <>
          <h1>LibroHub</h1>
          <button onClick={() => console.log('스크래핑 시작')}>스크래핑 시작</button>
          <button onClick={handleLogout}>로그아웃</button>
        </>
      ) : (
        <>
          <h1>로그인 필요</h1>
          <button onClick={handleLogin}>로그인하기</button>
        </>
      )}
    </div>
  );
}

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(<App />);
}
