import { Site } from '../../types/site';

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

export const getBooks = () => {
  chrome.cookies.getAll({ domain: 'elibrary.kyobobook.co.kr' }, async (cookies) => {
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ');

    const allBooks: KyoboBook[] = [];
    const fetchPage = async (page: number): Promise<boolean> => {
      try {
        const response = await fetch(
          'https://elibrary.kyobobook.co.kr/dig/api/v1/elb/elibrary/selectMyBookList',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Cookie: cookieHeader,
            },
            body: JSON.stringify({
              page,
              per: 10,
              categoryYn: 'N',
              mainCategoryYn: 'N',
              subCategoryYn: 'N',
              dgctSaleCmdtDvsnCode: null,
              dgctSaleFrDvsnCode: '',
              dgctCmdtDsplClstCode: null,
              cmdtHngName: null,
              filterYn: 'N',
              mmbrNum: '',
              orderBy: null,
              buyForm: '',
              bksCount: 0,
              samYn: 'N',
              searchYn: 'N',
            }),
            credentials: 'include',
          }
        );

        if (!response.ok) {
          console.warn(`도서 목록 요청 실패 (page ${page}):`, await response.text());
          return false;
        }
        const data = await response.json();
        if (Array.isArray(data.data) && data.data.length > 0) {
          allBooks.push(...data.data);
          return true;
        } else {
          return false;
        }
      } catch (error) {
        console.error(`도서 목록 요청 중 오류 (page ${page}):`, error);
        return false;
      }
    };
    let currentPage = 1;
    while (await fetchPage(currentPage)) {
      currentPage++;
    }
    console.log('전체 도서 목록:', allBooks);
  });
};

export type KyoboBook = {
  mmbrNum: string;
  nowBook: unknown;
  endBook: unknown;
  acmBook: unknown;
  allBook: unknown;
  myBsh: unknown;
  saleCmdtid: string;
  ordrSaleCmdtid: string;
  hgrnSaleCmdtid: string | null;
  rentYsno: string;
  srisYsno: string | null;
  cmdtHnglName: string;
  cmdtChrcName: string;
  pbcmName: string;
  imgUrl: string;
  dgctSaleFrDvsnCode: string;
  dgctSaleFrDvsnName: string;
  cnt: number | null;
  remaNmtm: number;
  remaNmtmStr: string;
  dgctFnrdRate: number;
  dgctSaleCmdtDvsnCode: string;
  dgctSaleCmdtDvsnName: string | null;
  dgctSaleCmdtDvsnBksCont: unknown;
  dgctCmdtDsplClstCode: string | null;
  dgctCmdtDsplClstName: string | null;
  dgctCmdtDsplClstBksCont: unknown;
  bksCmdtcode: string;
  bksSubCmdtcode: string;
  ordrId: string;
  dgctOrdrCmdtSrmb: string;
  samYsno: string;
  grpCodeNm: string | null;
  grpCode: string;
  subBookCnt: number;
  srsBookCnt: number;
  buyDate: string;
  rprsSaleCmdtid: string;
  dgctOrdrPatrCode: string;
  dgctElbCmdtCdtnCode: string;
  dgctSaleCmdtGrpCode: string;
  dgctUseSttgDttm: string;
  dgctUseEndDttm: string | null;
  dgctLastRdngDttm: string | null;
  downEndDttm: string | null;
  downEndYsno: string | null;
  splmYsno: string;
  webvwYsno: string;
  artlNum: string | null;
};
export type KyoboBookListResponse = {
  data: KyoboBook[];
  statusCode: number;
  resultCode: string | null;
  resultMessage: string;
  detailMessage: string;
};
