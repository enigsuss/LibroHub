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

  const handleKakaoLogin = () => {
    chrome.runtime.sendMessage({ type: 'LOGIN_REQUEST' }, (response) => {
      if (response?.success) {
        alert('로그인 성공');
        setIsLoggedIn(true);
        window.close();
      } else {
        alert(`로그인 실패: ${response?.error}`);
      }
    });
  };

  const handleKakaoLogout = async () => {
    try {
      const REST_API_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY;
      const LOGOUT_REDIRECT_URI = chrome.identity.getRedirectURL();

      if (!REST_API_KEY) {
        console.error('REST_API_KEY가 설정되지 않았습니다.');
        alert('환경 변수 설정 오류');
        return;
      }

      const logoutUrl = `https://kauth.kakao.com/oauth/logout?client_id=${REST_API_KEY}&logout_redirect_uri=${LOGOUT_REDIRECT_URI}`;
      const redirectedTo = await new Promise<string>((resolve, reject) => {
        chrome.identity.launchWebAuthFlow(
          {
            url: logoutUrl,
            interactive: true,
          },
          (redirectUrl) => {
            if (chrome.runtime.lastError || !redirectUrl) {
              reject(chrome.runtime.lastError || new Error('리디렉션 실패'));
            } else {
              resolve(redirectUrl);
            }
          }
        );
      });
      // 로그아웃 성공 후 리디렉션이 이뤄졌을 때만 로그아웃 처리
      if (redirectedTo.startsWith(LOGOUT_REDIRECT_URI)) {
        await chrome.storage.local.remove('accessToken');
        setIsLoggedIn(false);
      } else {
        console.warn('로그아웃 리디렉션되지 않음:', redirectedTo);
      }
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
        </>
      )}
    </div>
  );
}

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(<App />);
}
