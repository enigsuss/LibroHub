import {Suspense} from 'react'
import BookCard from "@/components/BookCard";
import type {Book} from '@/types/book'

async function getBooks(): Promise<Book[]> {
    // temporary data
    return [
        {
            id: "1",
            title: "The Great Gatsby",
            author: "F. Scott Fitzgerald",
            coverImage: "/placeholder.svg",
            service: "Kindle",
        },
        { id: "2", title: "1984", author: "George Orwell", coverImage: "/placeholder.svg", service: "Google Books" },
        {
            id: "3",
            title: "To Kill a Mockingbird",
            author: "Harper Lee",
            coverImage: "/placeholder.svg",
            service: "Apple Books",
        },
    ]
}

export default async function Home() {
    const books = await getBooks()

  return (
    <main className='container mx-auto px-4 py-8'>
        <h1 className='text-3xl font-bold mb-8'>My Ebook Library</h1>
        <Suspense fallback={<div>Loading...</div>}>
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
                {books.map((book)=> (
                    <BookCard key={book.id} book={book}/>
                ))}
            </div>
        </Suspense>
    </main>
  );
}
