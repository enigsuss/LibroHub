'use client';

import { Suspense } from 'react';
import BookCard from '@/components/BookCard';
import type { Book } from '@/types/book';
import { useQuery } from '@apollo/client';
import { GET_BOOKS_BY_USER } from '@/graphql/queries';

// async function getBooks(): Promise<Book[]> {
//   // temporary data
//   return [
//     {
//       id: '1',
//       title: 'The Great Gatsby',
//       author: 'F. Scott Fitzgerald',
//       coverImage: '/placeholder.svg',
//       service: 'Kindle',
//       user: {
//         id: 'u1',
//         username: 'gatsbyfan',
//         email: 'gatsbyfan@example.com',
//       },
//     },
//     {
//       id: '2',
//       title: '1984',
//       author: 'George Orwell',
//       coverImage: '/placeholder.svg',
//       service: 'Google Books',
//       user: {
//         id: 'u2',
//         username: 'bigbrother',
//         email: 'orwell1984@example.com',
//       },
//     },
//     {
//       id: '3',
//       title: 'To Kill a Mockingbird',
//       author: 'Harper Lee',
//       coverImage: '/placeholder.svg',
//       service: 'Apple Books',
//       user: {
//         id: 'u3',
//         username: 'justice4all',
//         email: 'lee@example.com',
//       },
//     },
//   ];
// }

export default function Home() {
  const { loading, error, data } = useQuery(GET_BOOKS_BY_USER, { variables: { userId: '1' } });

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error occurred: {error.message}</p>;

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Ebook Library</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {data.booksByUser.map((book: Book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      </Suspense>
    </main>
  );
}
