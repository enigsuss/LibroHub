import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { SiteLoginControl } from './SiteLoginControl';
import { Site } from '../types/site';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [isKyoboLoggedIn, setIsKyoboLoggedIn] = useState<boolean | null>(null);
  const [isYes24LoggedIn, setisYes24LoggedIn] = useState<boolean | null>(null);
  const [isAladinLoggedIn, setisAladinLoggedIn] = useState<boolean | null>(null);
  const [isRidiLoggedIn, setisRidiLoggedIn] = useState<boolean | null>(null);

  const loggedInSetters = useMemo(
    () => ({
      kyobo: setIsKyoboLoggedIn,
      yes24: setisYes24LoggedIn,
      aladin: setisAladinLoggedIn,
      ridi: setisRidiLoggedIn,
    }),
    []
  );

  useEffect(() => {
    (async () => {
      const { accessToken } = await chrome.storage.local.get(['accessToken']);
      setIsLoggedIn(!!accessToken);
    })();
  }, []);

  useEffect(() => {
    console.log('리스너 등록됨');
    const listener = async (message: { type: string; site: Site; action: string }) => {
      console.log('수신한 메시지:', message);
      if (message.type === 'SESSION' && message.site && message.action === 'active') {
        loggedInSetters[message.site](true);
        console.log('true');
      } else {
        chrome.storage.local.remove(message.site + 'Tokens').then(() => {
          loggedInSetters[message.site](false);
          console.log('false');
        });
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    chrome.runtime.sendMessage({ type: 'SESSION_PING', site: 'all' });

    return () => chrome.runtime.onMessage.removeListener(listener);
  }, [loggedInSetters]);

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

  const handleSiteLogout = async (site: Site) => {
    const confirmLogout = window.confirm(`${site.toUpperCase()}에서 로그아웃 할까요?`);
    if (!confirmLogout) return;

    const logoutSiteUrlObj = {
      kyobo: 'https://mmbr.kyobobook.co.kr/sso/logout',
      yes24: 'https://www.yes24.com/Templates/FTLogOut.aspx',
      aladin: 'http://www.aladin.co.kr/login/wlogout.aspx',
      ridi: 'https://ridibooks.com/account/logout',
    };

    try {
      const response = await fetch(logoutSiteUrlObj[site], {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        await chrome.storage.local.remove(site + 'Tokens');
        switch (site) {
          case 'kyobo':
            setIsKyoboLoggedIn(false);
            break;
          case 'yes24':
            setisYes24LoggedIn(false);
            break;
          case 'aladin':
            setisAladinLoggedIn(false);
            break;
          case 'ridi':
            setisRidiLoggedIn(false);
            break;
        }
      } else {
        console.warn('로그아웃 실패 : ' + site, response.status);
      }
    } catch (error) {
      console.error('로그아웃 중 오류 발생 : ' + site, error);
    }
  };

  if (isLoggedIn === null) {
    return <div>로딩 중...</div>;
  }

  const siteConfigs = [
    {
      name: '교보문고',
      key: 'kyobo',
      isLoggedIn: isKyoboLoggedIn,
      onLogin: () => chrome.runtime.sendMessage({ type: 'LOGIN', site: 'kyobo' }),
      onLogout: () => handleSiteLogout('kyobo'),
      imageSrc: '/icons/logo_kyobo',
    },
    {
      name: '알라딘',
      key: 'aladin',
      isLoggedIn: isAladinLoggedIn,
      onLogin: () => chrome.runtime.sendMessage({ type: 'LOGIN', site: 'aladin' }),
      onLogout: () => handleSiteLogout('aladin'),
      imageSrc: '/icons/logo_aladin',
    },
    {
      name: '리디',
      key: 'ridi',
      isLoggedIn: isRidiLoggedIn,
      onLogin: () => chrome.runtime.sendMessage({ type: 'LOGIN', site: 'ridi' }),
      onLogout: () => handleSiteLogout('ridi'),
      imageSrc: '/icons/logo_ridi',
    },
    {
      name: 'Yes24',
      key: 'yes24',
      isLoggedIn: isYes24LoggedIn,
      onLogin: () => chrome.runtime.sendMessage({ type: 'LOGIN', site: 'yes24' }),
      onLogout: () => handleSiteLogout('yes24'),
      imageSrc: '/icons/logo_yes24',
    },
  ];

  return (
    <div style={{ padding: '5px 20px 20px 20px', minWidth: 250, borderRadius: 12 }}>
      {isLoggedIn ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h1>LibroHub</h1>
            <img
              src="/icons/kakao_signout.png"
              alt="카카오계정 로그아웃"
              width={27}
              height={27}
              onClick={handleKakaoLogout}
              style={{ cursor: 'pointer' }}
            />
          </div>

          <button
            onClick={() => {
              chrome.runtime.sendMessage({ type: 'GET_BOOKS' });
            }}
          >
            도서목록 가져오기
          </button>
          {siteConfigs.map((site) => (
            <SiteLoginControl
              key={site.key}
              name={site.name}
              isLoggedIn={site.isLoggedIn}
              onLogin={site.onLogin}
              onLogout={site.onLogout}
              imageSrc={site.imageSrc}
            />
          ))}
        </>
      ) : (
        <>
          <h1>Librohub</h1>
          <img
            src="/icons/kakao_login_large_wide.png"
            alt="카카오계정 로그인"
            width={290}
            height={40}
            onClick={handleKakaoLogin}
            style={{ cursor: 'pointer' }}
          />
        </>
      )}
    </div>
  );
}

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(<App />);
}
