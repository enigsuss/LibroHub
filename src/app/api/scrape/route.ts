import {
  scrapeEbookLibraryAL,
  scrapeEbookLibraryKY,
  scrapeEbookLibraryRI,
  scrapeEbookLibraryYE,
} from '@/lib/scraper/libroScraper';
import { NextResponse } from 'next/server';

export async function GET() {
  const booksKY = await scrapeEbookLibraryKY(process.env.USER_ID_KY!, process.env.USER_PW_KY!);
  const booksAL = await scrapeEbookLibraryAL(process.env.USER_ID_AL!, process.env.USER_PW_AL!);
  const booksYE = await scrapeEbookLibraryYE(process.env.USER_ID_YE!, process.env.USER_PW_YE!);
  const booksRI = await scrapeEbookLibraryRI(process.env.USER_ID_RI!, process.env.USER_PW_RI!);

  return NextResponse.json({
    kyobo: booksKY,
    aladin: booksAL,
    yes24: booksYE,
    ridi: booksRI,
  });
}
