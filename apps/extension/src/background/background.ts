chrome.runtime.onInstalled.addListener(() => {
  console.log('LibroHub Extension installed!');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'LOGIN_REQUEST') {
    const REDIRECT_URI = chrome.identity.getRedirectURL();
    console.log(REDIRECT_URI);
    const REST_API_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY;

    console.log(REST_API_KEY); // undefined

    const authUrl = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${REST_API_KEY}&redirect_uri=${REDIRECT_URI}`;

    console.log(authUrl);
    chrome.identity.launchWebAuthFlow(
      {
        url: authUrl,
        interactive: true,
      },
      async (redirectedTo) => {
        if (chrome.runtime.lastError || !redirectedTo) {
          sendResponse({ success: false, error: chrome.runtime.lastError?.message });
          return;
        }

        const url = new URL(redirectedTo);
        const code = new URLSearchParams(url.search).get('code');

        if (!code) {
          sendResponse({ success: false, error: 'No code received' });
          return;
        }

        try {
          const response = await fetch('http://localhost:5001/auth/callback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code }),
          });

          const data = await response.json();
          if (data.access_token) {
            await chrome.storage.local.set({ accessToken: data.access_token });
            sendResponse({ success: true });
          } else {
            sendResponse({ success: false, error: 'No access token received' });
          }
        } catch (err) {
          sendResponse({
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error',
          });
        }
      }
    );

    // indicate async response
    return true;
  }
});
