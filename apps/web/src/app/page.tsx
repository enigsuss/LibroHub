'use client';

import { Suspense, useEffect, useState } from 'react';
import BookCard from '@/components/BookCard';
import type { NormalizedBook } from '@/types/book';

export default function Home() {
  const [allSiteBooks, setAllSiteBooks] = useState([]);

  useEffect(() => {
    console.log('postMessage : FETCH_BOOKS');
    window.postMessage({ type: 'FETCH_BOOKS', site: 'all' }, '*');

    const handler = (event: MessageEvent) => {
      if (event.data.type === 'BOOKS_RECEIVED') {
        console.log('도서 목록 도착', event.data.books);
        setAllSiteBooks(event.data.books);
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Ebook Library</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Object.values(allSiteBooks).flatMap((books: NormalizedBook[]) =>
            books.map((book) => <BookCard key={book.title + book.author} book={book} />)
          )}
        </div>
      </Suspense>
    </main>
  );
}
