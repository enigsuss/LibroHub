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

  const handleKakaoLogin = async () => {
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
      const queryParams = new URLSearchParams(url.search);
      const code = queryParams.get('code');

      if (code) {
        await fetch('http://localhost:5001/auth/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        });

        alert('서버로 인가 코드 전송 완료');
      } else {
        alert('로그인 실패: code가 없습니다.');
      }
    } catch (error) {
      console.error('OAuth 로그인 실패', error);
    }
  };

  const handleKakaoLogout = async () => {
    try {
      const REST_API_KEY = import.meta.env.VITE_REST_API_KEY;
      const LOGOUT_REDIRECT_URI = chrome.identity.getRedirectURL();

      if (!REST_API_KEY) {
        console.error('REST_API_KEY가 설정되지 않았습니다.');
        alert('환경 변수 설정 오류');
        return;
      }

      const logoutUrl = `https://kauth.kakao.com/oauth/logout?client_id=${REST_API_KEY}&logout_redirect_uri=${LOGOUT_REDIRECT_URI}`;

      window.open(logoutUrl, '_blank', 'width=500,height=600');
    } catch (error) {
      console.error('카카오 로그아웃 실패', error);
    }
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
          <button onClick={handleKakaoLogout}>카카오계정 로그아웃</button>
        </>
      ) : (
        <>
          <h1>로그인 필요</h1>
          <button onClick={handleKakaoLogin}>로그인하기</button>
          <button onClick={handleKakaoLogout}>카카오계정 로그아웃</button>
        </>
      )}
    </div>
  );
}

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(<App />);
}
