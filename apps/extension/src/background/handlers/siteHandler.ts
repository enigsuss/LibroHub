import { Site } from '../../types/site';
import { getAladinBooks, getKyoboBooks } from './bookHandler';

export const handleSiteLogin = (
  sendResponse: (res: { success: boolean; site?: string; error?: string }) => void,
  site: Site
): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const siteLoginObj = {
        kyobo: {
          loginUrl:
            'https://mmbr.kyobobook.co.kr/login?continue=https%3A%2F%2Fwww.kyobobook.co.kr%2F',
          redirectUrl: 'https://www.kyobobook.co.kr/',
          loginHostname: 'mmbr.kyobobook.co.kr',
          mainHostname: 'www.kyobobook.co.kr',
          loginPathPrefix: '/login',
          redirectPathPrefix: '/',
          accessTokenName: 'accessToken',
          refreshTokenName: 'refreshToken',
        },
        yes24: {
          loginUrl: '',
          redirectUrl: '',
          loginHostname: '',
          mainHostname: '',
          loginPathPrefix: '',
          redirectPathPrefix: '',
          accessTokenName: '',
          refreshTokenName: '',
        },
        aladin: {
          loginUrl: 'https://www.aladin.co.kr/login/wlogin_popup.aspx?SecureOpener=1',
          redirectUrl: 'https://www.aladin.co.kr/login/wlogin_popup_result.aspx?SecureOpener=1',
          loginHostname: 'www.aladin.co.kr',
          mainHostname: 'www.aladin.co.kr',
          loginPathPrefix: '/login/wlogin_popup.aspx',
          redirectPathPrefix: '/login/wlogin_popup_result.aspx',
          accessTokenName: 'AladdinLogin',
          refreshTokenName: '',
        },
        ridi: {
          loginUrl:
            'https://ridibooks.com/account/login?return_url=https%3A%2F%2Fridibooks.com%2Febook%2Fview-category-300',
          redirectUrl: 'https://ridibooks.com/ebook/view-category-300',
          loginHostname: 'ridibooks.com',
          mainHostname: 'ridibooks.com',
          loginPathPrefix: '/account/login',
          redirectPathPrefix: '/ebook/view-category-300',
          accessTokenName: 'PHPSESSID',
          refreshTokenName: '',
        },
      };

      chrome.tabs.create({ url: siteLoginObj[site].loginUrl, active: true }, (tab) => {
        const tabId = tab.id;

        const listener = (updatedTabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
          if (updatedTabId === tabId && changeInfo.url) {
            const newUrl = changeInfo.url;
            const urlObj = new URL(newUrl);
            console.log('[DEBUG] tab URL changed:', newUrl);
            if (
              urlObj.hostname === siteLoginObj[site].loginHostname &&
              urlObj.pathname.startsWith(siteLoginObj[site].loginPathPrefix)
            ) {
              console.log('LOGIN Window Opened, RETURN');
              return;
            }
            if (
              urlObj.hostname === siteLoginObj[site].mainHostname &&
              urlObj.pathname.startsWith(siteLoginObj[site].redirectPathPrefix)
            ) {
              console.log('LOGIN SUCCESS : ' + site);
              setTimeout(() => {
                chrome.cookies.get(
                  { url: newUrl, name: siteLoginObj[site].accessTokenName },
                  (accessCookie) => {
                    chrome.cookies.get(
                      { url: newUrl, name: siteLoginObj[site].refreshTokenName },
                      (refreshCookie) => {
                        if (accessCookie) {
                          const tokens: { accessToken: string; refreshToken?: string } = {
                            accessToken: accessCookie.value,
                          };
                          if (refreshCookie) {
                            tokens.refreshToken = refreshCookie.value;
                          }
                          chrome.storage.local.set({ [site + 'Tokens']: tokens }, () => {
                            console.log('Tokens saved to local storage:', tokens, site);
                            sendResponse({ success: true, site });
                            if (tabId !== undefined) chrome.tabs.remove(tabId!);
                            resolve();
                          });
                        } else {
                          console.warn('Some tokens were not found');
                          chrome.tabs.onUpdated.removeListener(listener);
                          sendResponse({ success: false, error: 'Not logged in' });
                          if (tabId !== undefined) chrome.tabs.remove(tabId!);
                          reject(new Error('Login failed : ' + site));
                        }
                      }
                    );
                  }
                );
                chrome.tabs.onUpdated.removeListener(listener);
              }, 300);
            }
          }
        };
        chrome.tabs.onUpdated.addListener(listener);
      });
    } catch (err) {
      console.error(err);
      sendResponse({ success: false, error: 'Failed to login : ' + site });
      reject(err);
    }
  });
};

export const sendSessionPing = (site: Site) => {
  console.log('SessionPing : ' + site);
  switch (site) {
    case 'kyobo':
      return fetchSitePing(site);
    case 'ridi':
      return fetchSitePing(site);
    case 'yes24':
      return fetchSitePing(site);
    case 'aladin':
      return fetchSitePing(site);
  }
};

const fetchSitePing = (site: Site) => {
  const pingUrlObj = {
    kyobo: { url: 'https://www.kyobobook.co.kr/api/user/info', method: 'GET' },
    yes24: { url: '', method: '' },
    aladin: {
      url: 'https://www.aladin.co.kr/account/wmaininfo.aspx?pType=EBookOrders',
      method: 'GET',
    },
    ridi: { url: 'https://account.ridibooks.com/accounts/me', method: 'GET' },
  };
  console.log('fetching : ' + site);
  chrome.storage.local.get(site + 'Tokens', async (data) => {
    const tokensKey = site + 'Tokens';
    const { accessToken } = data[tokensKey] || {};
    if (!accessToken) {
      console.warn('토큰 없음 : ' + site);
      chrome.runtime.sendMessage({ type: 'SESSION', site, action: 'expired' });
      return;
    }

    try {
      const res = await fetch(pingUrlObj[site].url, {
        method: pingUrlObj[site].method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: 'include',
      });

      const contentType = res.headers.get('content-type');
      let responseData;

      if (contentType && contentType.includes('application/json')) {
        responseData = await res.json();
      } else {
        responseData = await res.text();
      }
      if (site === 'aladin') {
        const short = responseData.slice(0, 1000);
        const isLoggedOut = short.includes('로그인');

        if (isLoggedOut) {
          chrome.runtime.sendMessage({ type: 'SESSION', site, action: 'expired' });
        } else {
          chrome.runtime.sendMessage({ type: 'SESSION', site, action: 'active' });
        }
        return;
      }
      if (
        res.ok &&
        (!responseData || (responseData.statusCode !== 500 && responseData.statusCode !== 401))
      ) {
        console.log('로그인 상태 유지중 : ' + site);
        chrome.runtime.sendMessage({ type: 'SESSION', site, action: 'active' });
      } else {
        console.warn('세션 확인 실패 : ' + site, responseData);
        chrome.runtime.sendMessage({ type: 'SESSION', site, action: 'expired' });
      }
    } catch (err) {
      console.error('세션 ping 중 에러 : ' + site, err);
      chrome.runtime.sendMessage({ type: 'SESSION', site, action: 'expired' });
    }
  });
};

export const getBooks = (site: Site) => {
  switch (site) {
    case 'kyobo':
      getKyoboBooks();
      break;
    case 'yes24':
      break;
    case 'aladin':
      getAladinBooks();
      break;
    case 'ridi':
      break;
  }
};
