export const handleKYLogin = (
  sendResponse: (res: { success: boolean; site?: string; error?: string }) => void
): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const loginUrl =
        'https://mmbr.kyobobook.co.kr/login?continue=https%3A%2F%2Fwww.kyobobook.co.kr%2F';

      chrome.tabs.create({ url: loginUrl, active: true }, (tab) => {
        const tabId = tab.id;

        const listener = (updatedTabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
          if (updatedTabId === tabId && changeInfo.url) {
            const newUrl = changeInfo.url;
            const urlObj = new URL(newUrl);
            if (
              urlObj.hostname === 'mmbr.kyobobook.co.kr' &&
              urlObj.pathname.startsWith('/login')
            ) {
              return;
            }
            if (
              urlObj.hostname.endsWith('.kyobobook.co.kr') ||
              urlObj.hostname === 'kyobobook.co.kr'
            ) {
              setTimeout(() => {
                chrome.cookies.get({ url: newUrl, name: 'accessToken' }, (accessCookie) => {
                  chrome.cookies.get({ url: newUrl, name: 'refreshToken' }, (refreshCookie) => {
                    if (accessCookie && refreshCookie) {
                      const tokens = {
                        accessToken: accessCookie.value,
                        refreshToken: refreshCookie.value,
                      };
                      chrome.storage.local.set({ kyoboTokens: tokens }, () => {
                        console.log('Tokens saved to local storage:', tokens);
                        sendResponse({ success: true, site: 'kyobo' });
                        if (tabId !== undefined) chrome.tabs.remove(tabId!);
                        resolve();
                      });
                    } else {
                      console.warn('Some tokens were not found');
                      sendResponse({ success: false, error: 'Not logged in' });
                      if (tabId !== undefined) chrome.tabs.remove(tabId!);
                      reject(new Error('Kyobo login failed'));
                    }
                  });
                });
                chrome.tabs.onUpdated.removeListener(listener);
              }, 1000);
            }
          }
        };
        chrome.tabs.onUpdated.addListener(listener);
      });
    } catch (err) {
      console.error(err);
      sendResponse({ success: false, error: 'Failed to login to Kyobo' });
    }
  });
};

export const sendSessionPing = (site: 'kyobo' | 'ridibooks' | 'yes24' | 'aladin') => {
  console.log('SessionPing : ' + site);
  switch (site) {
    case 'kyobo':
      return fetchKyoboPing(site);
    case 'ridibooks':
      return;
    case 'yes24':
      return;
    case 'aladin':
      return;
  }
};

const fetchKyoboPing = (site: string) => {
  console.log('fetching : ' + site);
  chrome.storage.local.get(site + 'Tokens', async (data) => {
    const { accessToken } = data.kyoboTokens || {};
    if (!accessToken) return;

    try {
      const res = await fetch('https://www.kyobobook.co.kr/api/user/info', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: 'include',
      });

      const responseData = await res.json();

      if (res.ok && responseData.statusCode !== 500) {
        console.log('로그인 상태 유지중 : ' + site);
        chrome.runtime.sendMessage({ type: 'SESSION', site: 'kyobo', action: 'active' });
      } else {
        console.warn('세션 확인 실패 : ' + site, responseData);
        chrome.runtime.sendMessage({ type: 'SESSION', site: 'kyobo', action: 'expired' });
      }
    } catch (err) {
      console.error('세션 ping 중 에러 : ' + site, err);
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
