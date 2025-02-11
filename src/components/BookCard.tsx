import Image from 'next/image'
import type {Book} from '@/types/book'

export default function BookCard({book}: {book: Book}){
    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <Image
                src={book.coverImage || "/placeholder.svg"}
                alt={`cover of ${book.title}`}
                width={200}
                height={200}
                className="w-full h-48 object-cover"
                />
            <div className='p-4'>
                <h3 className='font-bold text-lg mb-2 truncate'>{book.title}</h3>
                <p className='text-gray-600 text-sm mb-2'>{book.author}</p>
                <span className='inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700'>
                    {book.service}
                </span>
            </div>
        </div>
    )
}