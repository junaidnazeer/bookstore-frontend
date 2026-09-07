import Link from "next/link";

// Expects a book shaped like the API contract: { id, title, author, price, coverUrl }
export default function BookCard({ book }) {
  return (
    <Link
      href={`/books/${book.id}`}
      className="block border border-neutral-200 rounded p-4 hover:border-neutral-400 transition-colors"
    >
      <div className="aspect-[2/3] bg-neutral-100 mb-3 rounded overflow-hidden">
        {book.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.coverUrl}
            alt={book.title}
            className="w-full h-full object-cover"
          />
        )}
      </div>
      <h3 className="font-medium text-neutral-900">{book.title}</h3>
      <p className="text-sm text-neutral-500">{book.author}</p>
      <p className="mt-1 font-semibold">₹{book.price}</p>
    </Link>
  );
}
