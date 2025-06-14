import { KyoboBook, NormalizedBook, RidiBook } from '../../types/book';

export const getKyoboBooks = async (): Promise<NormalizedBook[]> => {
  const cookies = await chrome.cookies.getAll({ domain: 'elibrary.kyobobook.co.kr' });
  const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ');

  const allBooks: KyoboBook[] = [];

  const fetchPage = async (page: number): Promise<boolean> => {
    try {
      const res = await fetch(
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

      if (!res.ok) {
        console.warn(`도서 목록 요청 실패 (page ${page}):`, await res.text());
        return false;
      }

      const data = await res.json();
      if (Array.isArray(data.data) && data.data.length > 0) {
        allBooks.push(...data.data);
        return true;
      } else {
        return false;
      }
    } catch (e) {
      console.error('도서 목록 요청 중 에러:', e);
      return false;
    }
  };

  let page = 1;
  while (await fetchPage(page)) {
    page++;
  }

  const normalized = normalizeKyoboBooks(allBooks);
  console.log('교보 도서 목록:', normalized);
  return normalized;
};

export const getAladinBooks = async () => {
  const res = await fetch('https://www.aladin.co.kr/account/wmaininfo.aspx?pType=EBookOrders', {
    credentials: 'include',
  });
  const html = await res.text();

  const bookRegex =
    /<tr>[\s\S]*?<td[^>]*class="myacc_td05"[^>]*>[\s\S]*?<img[^>]+src="([^"]+)"[^>]*>[\s\S]*?<div[^>]*class="ebook_list_tit"[^>]*>[\s\S]*?<a[^>]+href="([^"]+)"[^>]*>([^<]*)<\/a>[\s\S]*?<br[^>]*>([^<]*)<\/div>[\s\S]*?<td[^>]*class="myacc_td03"[^>]*>([^<]*)<\/td>[\s\S]*?<td[^>]*class="myacc_td03"[^>]*>([^<]*)<\/td>/g;
  const books = [];
  let match;
  while ((match = bookRegex.exec(html)) !== null) {
    const image = match[1]?.trim();
    const link = 'https://www.aladin.co.kr' + match[2]?.trim();
    const title = match[3]?.trim();
    const author = match[4]?.trim();
    const orderDate = match[5]?.trim();
    const usagePeriod = match[6]?.trim();
    const site = 'aladin';
    books.push({ title, author, image, link, orderDate, usagePeriod, site });
  }

  console.log('알라딘 도서 목록:', books);
  return books;
};

export const getRidiBooks = async () => {
  const cookies = await chrome.cookies.getAll({ domain: 'ridibooks.com' });
  const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ');
  const res = await fetch(
    'https://library-api.ridibooks.com/items/main/?offset=0&limit=48&order_type=purchase_date&order_by=desc',
    {
      headers: {
        Cookie: cookieHeader,
      },
    }
  );
  const data = await res.json();
  const normalizedBook = normalizeRidiBooks(data.items);
  console.log('리디 도서 목록 : ', normalizedBook);
  return normalizedBook;
};

const normalizeKyoboBooks = (rawBooks: KyoboBook[]): NormalizedBook[] => {
  return rawBooks.map((b) => ({
    title: b.cmdtHnglName ?? '',
    author: b.cmdtChrcName ?? '',
    image: b.imgUrl ? `https://contents.kyobobook.co.kr/sih/fit-in/690x1030/pdt/${b.imgUrl}` : '',
    link: 'https://ebook-product.kyobobook.co.kr/dig/epd/ebook/' + b.ordrSaleCmdtid,
    orderDate: b.buyDate ?? '',
    usagePeriod: '',
    site: 'kyobo',
  }));
};

const normalizeRidiBooks = (rawBooks: RidiBook[]): NormalizedBook[] => {
  return rawBooks.map((b) => ({
    title: b.unit_title ?? '',
    author: '',
    image: `https://img.ridicdn.net/cover/${b.b_id}/xxlarge#1?dpi=xhdpi`,
    link: '',
    orderDate: b.purchase_date?.split('T')[0] ?? '',
    usagePeriod: '',
    site: 'ridi',
  }));
};
