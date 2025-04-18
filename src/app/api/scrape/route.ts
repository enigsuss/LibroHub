import { scrapeEbookLibraryAL, scrapeEbookLibraryKY } from '@/lib/scraper/libroScraper';
import { NextResponse } from 'next/server';

export async function GET() {
  const booksKY = await scrapeEbookLibraryKY(process.env.USER_ID_KY!, process.env.USER_PW_KY!);
  const booksAL = await scrapeEbookLibraryAL(process.env.USER_ID_AL!, process.env.USER_PW_AL!);

  return NextResponse.json({
    kyobo: booksKY,
    aladin: booksAL,
  });
}
