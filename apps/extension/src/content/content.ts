console.log('LibroHub content script injected!');

// content-script.ts
window.addEventListener('message', (event) => {
  if (event.source !== window || !event.data.type) return;

  if (event.data.type === 'FETCH_BOOKS') {
    console.log('received message : FETCH_BOOKS');
    chrome.runtime.sendMessage({ type: 'FETCH_BOOKS', site: event.data.site }, (response) => {
      window.postMessage({ type: 'BOOKS_RECEIVED', books: response.books }, '*');
    });
  }
});
