import { useState } from 'react'

interface Book {
  id: string
  title: string
  author: string
  coverUrl?: string
  duration: number
}

interface LibraryViewProps {
  onSelectBook: () => void
}

export default function LibraryView({ onSelectBook }: LibraryViewProps) {
  const [selectedBook, setSelectedBook] = useState<number>(0)
  
  // Mock data - will be replaced with API calls
  const books: Book[] = [
    { id: '1', title: 'The Hobbit', author: 'J.R.R. Tolkien', duration: 660 },
    { id: '2', title: 'Dune', author: 'Frank Herbert', duration: 810 },
    { id: '3', title: '1984', author: 'George Orwell', duration: 420 },
    { id: '4', title: 'Pride and Prejudice', author: 'Jane Austen', duration: 720 },
    { id: '5', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', duration: 360 },
  ]

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  return (
    <div className="w-full h-full p-htpc-6">
      <h1 className="text-htpc-3xl font-bold mb-htpc-6">Library</h1>
      
      <div className="grid grid-cols-5 gap-htpc-4">
        {books.map((book, index) => (
          <div
            key={book.id}
            onClick={() => {
              setSelectedBook(index)
              onSelectBook()
            }}
            className={`
              cursor-pointer transition-all duration-200
              ${selectedBook === index 
                ? 'ring-4 ring-primary scale-105' 
                : 'hover:ring-2 hover:ring-surfaceHighlight hover:scale-102'
              }
            `}
          >
            <div className="bg-surface rounded-lg overflow-hidden aspect-[2/3] mb-htpc-2">
              <div className="w-full h-full flex items-center justify-center text-surfaceHighlight">
                <span className="text-htpc-2xl">📚</span>
              </div>
            </div>
            <h3 className="text-htpc-base font-semibold truncate">{book.title}</h3>
            <p className="text-htpc-sm text-gray-400 truncate">{book.author}</p>
            <p className="text-htpc-sm text-gray-500">{formatDuration(book.duration)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
