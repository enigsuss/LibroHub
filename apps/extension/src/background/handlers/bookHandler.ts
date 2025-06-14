import { KyoboBook } from '../../types/book';

export const getKyoboBooks = () => {
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
    console.log('전체 도서 목록 : Kyobo', allBooks);
  });
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
    const link = match[2]?.trim();
    const title = match[3]?.trim();
    const author = match[4]?.trim();
    const orderDate = match[5]?.trim();
    const usagePeriod = match[6]?.trim();
    books.push({ title, author, image, link, orderDate, usagePeriod });
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
  console.log('리디 도서 목록 : ', data);
};
