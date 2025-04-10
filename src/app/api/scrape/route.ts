import { scrapeEbookLibrary } from '@/lib/scraper/libroScraper';
import { NextResponse } from 'next/server';

export async function GET() {
  const books = await scrapeEbookLibrary(process.env.USER_ID!, process.env.USER_PW!);
  return NextResponse.json(books);
}
