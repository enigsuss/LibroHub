import { chromium } from 'playwright';

export async function scrapeEbookLibraryKY(userId: string, userPw: string) {
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    locale: 'ko-KR',
  });
  const page = await context.newPage();

  await page.goto(
    'https://mmbr.kyobobook.co.kr/login?continue=https%3A%2F%2Febook.kyobobook.co.kr%2Fdig%2Fpnd%2Fwelcome'
  );

  await page.evaluate(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  await page.fill('input.form_ip[type="email"]', userId);
  await page.fill('input.form_ip[type="password"]', userPw);
  await page.click('input.form_ip[type="email"]');

  await page.waitForSelector('#loginBtn:not([disabled])');
  await page.click('#loginBtn');

  const currentUrl = page.url();
  if (currentUrl.includes('/login/verify/change-password')) {
    await page.click('a.btn_lg.btn_line_primary:has-text("90일 후 변경")');
  }

  await page.waitForURL('**/dig/pnd/welcome', { waitUntil: 'networkidle' });
  await page.goto('https://elibrary.kyobobook.co.kr/dig/elb/elibrary');
  await page.waitForLoadState('networkidle');

  const books = await page.$$eval('#myBookList > li', (nodes) =>
    nodes.map((el) => {
      const title = el.querySelector('.info strong')?.textContent?.trim() || '';
      const author = el.querySelector('.info span:nth-of-type(1)')?.textContent?.trim() || '';
      const publisher = el.querySelector('.info span:nth-of-type(2)')?.textContent?.trim() || '';
      const image = el.querySelector('.img img')?.getAttribute('src') || '';
      const status =
        el.querySelector('.info .own em')?.textContent?.trim() ||
        el.querySelector('.info .end em')?.textContent?.trim() ||
        '';
      const progress = el.querySelector('.img em')?.textContent?.trim() || '';

      return { title, author, publisher, image, status, progress };
    })
  );

  await browser.close();

  return books;
}

export async function scrapeEbookLibraryAL(userId: string, userPw: string) {
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    locale: 'ko-KR',
  });
  const page = await context.newPage();

  await page.goto('https://www.aladin.co.kr/login/wlogin.aspx?returnurl=/');

  await page.evaluate(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  await page.fill('#Email', userId);
  await page.fill('#Password', userPw);
  await page.click('.button_login1_2016');

  await page.waitForURL('**/home/welcome.aspx', { waitUntil: 'networkidle' });

  const alarmButton = await page.$('button.gray_btn:has-text("받지 않기")');
  if (alarmButton) {
    await alarmButton.click();
    await page.waitForLoadState('networkidle');
  }

  const closeButton = await page.$('button.pink_btn:has-text("닫기")');
  if (closeButton) {
    await closeButton.click();
    await page.waitForLoadState('networkidle');
  }

  await page.click('a[title="마이페이지"]');
  await page.waitForLoadState('networkidle');

  await page.click('a.ml:has-text("eBook 구매목록")');
  await page.waitForLoadState('networkidle');

  const books = await page.$$eval('#ebook_item_list tr', (rows) =>
    rows.map((row) => {
      const title = row.querySelector('.ebook_list_tit a')?.textContent?.trim() || '';
      const author =
        (row.querySelector('.ebook_list_tit') as HTMLElement)?.innerText?.split('\n')[1]?.trim() ||
        '';
      const image = row.querySelector('.ebook_list_cover img')?.getAttribute('src') || '';
      const orderDate = row.querySelectorAll('td.myacc_td03')[1]?.textContent?.trim() || '';
      const usagePeriod = row.querySelectorAll('td.myacc_td03')[2]?.textContent?.trim() || '';

      return { title, author, image, orderDate, usagePeriod };
    })
  );

  await browser.close();

  return books;
}

export async function scrapeEbookLibraryYE(userId: string, userPw: string) {
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    locale: 'ko-KR',
  });
  const page = await context.newPage();

  await page.goto('https://www.yes24.com/Templates/FTLogin.aspx');

  await page.evaluate(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  await page.fill('#SMemberID', userId);
  await page.fill('#SMemberPassword', userPw);
  await page.click('#btnLogin');

  await page.waitForURL((url) => url.href.includes('yes24.com'), {
    waitUntil: 'networkidle',
  });

  await page.goto('https://www.yes24.com/Member/FTMyWebLibrary.aspx');
  await page.waitForLoadState('networkidle');

  const books = await page.$$eval('tbody > tr', (rows) => {
    const rawBooks = rows
      .filter((row) => row.querySelector('.myPg_name strong'))
      .map((row) => {
        const title = row.querySelector('.myPg_name strong')?.textContent?.trim() || '';
        const author =
          row.querySelector('.myPg_auth')?.textContent?.replace(/ 저$/, '')?.trim() || '';
        const publisher = row.querySelector('.myPg_pub')?.textContent?.trim() || '';
        const pubDate = row.querySelector('.myPg_date')?.textContent?.trim() || '';
        const image = row.querySelector('.myPg_img img')?.getAttribute('src') || '';
        const price = row.querySelector('.myPg_price')?.textContent?.trim() || '';
        const orderDate = row.querySelector('td:nth-child(4)')?.textContent?.trim() || '';
        const expiredAt = row.querySelector('td:nth-child(5)')?.textContent?.trim() || '';
        const status =
          row.querySelector('td:nth-child(2)')?.childNodes[0]?.textContent?.trim() || '';

        return { title, author, publisher, pubDate, image, orderDate, expiredAt, price, status };
      });

    const seen = new Set();
    return rawBooks.filter((book) => {
      const key = `${book.title}-${book.orderDate}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  });

  await browser.close();

  return books;
}

export async function scrapeEbookLibraryRI(userId: string, userPw: string) {
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    locale: 'ko-KR',
  });
  const page = await context.newPage();

  await page.goto('https://ridibooks.com/account/login?');

  await page.evaluate(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  await page.fill('#id', userId);
  await page.fill('#password', userPw);
  await page.click('#id');

  await page.click('button[type="submit"]');
  await page.waitForURL('https://ridibooks.com/**/recommendation', { waitUntil: 'networkidle' });

  await page.goto('https://ridibooks.com/library');
  await page.waitForLoadState('networkidle');

  await page.click('button:has-text("정렬")');
  await page.waitForSelector('button:has-text("목록 보기")');
  await page.click('button:has-text("목록 보기")');

  const books = await page.$$eval('.Book.css-tjkok5', (nodes) =>
    nodes
      .map((el) => {
        const title = el.querySelector('p.css-1s2rrir')?.textContent?.trim() || '';
        const author = el.querySelector('p.css-vdu3w7')?.textContent?.trim() || '';
        const image = el.querySelector('div.css-m7vpx0 img')?.getAttribute('src') || '';
        const url = el.querySelector('div.css-1rqos7d a')?.getAttribute('href') || '';

        if (!title) return null;
        return {
          title,
          author,
          image,
          url: url ? `https://ridibooks.com${url}` : '',
        };
      })
      .filter(Boolean)
  );

  await browser.close();

  return books;
}
