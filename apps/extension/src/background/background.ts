import { handleKakaoLogin } from './handlers/authHandler';
import { getBooks, handleSiteLogin, sendSessionPing } from './handlers/siteHandler';
import { getAladinBooks, getKyoboBooks, getRidiBooks, getYes24Books } from './handlers/bookHandler';

chrome.runtime.onInstalled.addListener(() => {
  console.log('LibroHub Extension installed!');
  chrome.alarms.create('keepKyoboSessionAlive', {
    periodInMinutes: 5,
  });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'keepKyoboSessionAlive') {
    console.log('AlarmListener');
    sendSessionPing('kyobo');
  }
});

chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get(['kyoboTokens'], (result) => {
    const tokens = result.kyoboTokens;
    if (tokens?.accessToken && tokens?.refreshToken) {
      console.log('Restoring Kyobo session using saved tokens.');

      const cookies = [
        { name: 'accessToken', value: tokens.accessToken },
        { name: 'refreshToken', value: tokens.refreshToken },
      ];
      cookies.forEach(({ name, value }) => {
        chrome.cookies.set({
          url: 'https://www.kyobobook.co.kr',
          name,
          value,
          domain: '.kyobobook.co.kr',
          path: '/',
          secure: true,
          httpOnly: false,
          sameSite: 'no_restriction',
        });
      });
    } else {
      console.log('No saved Kyobo tokens found.');
    }
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'LOGIN_REQUEST') {
    handleKakaoLogin(sendResponse);
    return true;
  }
  if (message.type === 'LOGIN') {
    handleSiteLogin(sendResponse, message.site)
      .then(() => {
        getBooks(message.site);
        sendResponse({ success: true });
      })
      .catch((err) => {
        console.error(err);
        sendResponse({ success: false, error: err.message });
      });
    return true;
  }
  if (message.type === 'GET_BOOKS') {
    if (!message.site) {
      getKyoboBooks();
      getAladinBooks();
      getRidiBooks();
      getYes24Books();
    }
    getBooks(message.site);
  }
  if (message.type === 'SESSION_PING') {
    if (message.site === 'all') {
      const supportedSites = ['kyobo', 'yes24', 'aladin', 'ridi'] as const;
      supportedSites.forEach((site) => sendSessionPing(site));
    }
    sendSessionPing(message.site);
  }
  if (message.type === 'FETCH_BOOKS') {
    console.log('EXTENSION :: received Message :: FETCH_BOOKS');
    console.log(message);

    const { site } = message;

    if (site === 'all') {
      Promise.all([getKyoboBooks(), getAladinBooks(), getRidiBooks(), getYes24Books()])
        .then(([kyoboBooks, aladinBooks, ridiBooks, yes24Books]) => {
          const merged = {
            kyobo: kyoboBooks,
            aladin: aladinBooks,
            ridi: ridiBooks,
            yes24: yes24Books,
          };
          sendResponse({ books: merged });
        })
        .catch((err) => {
          console.error('Error fetching all books:', err);
          sendResponse({ error: err.message });
        });
      return true;
    }

    if (site === 'ridi') {
      getRidiBooks().then((books) => sendResponse({ books }));
      return true;
    }

    if (site === 'aladin') {
      getAladinBooks().then((books) => sendResponse({ books }));
      return true;
    }

    if (site === 'kyobo') {
      getKyoboBooks().then((books) => sendResponse({ books }));
      return true;
    }
  }
});
