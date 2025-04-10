import { chromium } from 'playwright';

export async function scrapeEbookLibrary(userId: string, userPw: string) {
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

  await page.click('a[title="e-라이브러리"]');
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
