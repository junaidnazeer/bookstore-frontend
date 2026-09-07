import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import api from "../../lib/api";

export default function BookDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [book, setBook] = useState(null);

  useEffect(() => {
    if (!id) return;
    api
      .get(`/books/${id}`)
      .then((res) => setBook(res.data))
      .catch(() => setBook(null));
  }, [id]);

  if (!book) {
    return (
      <div>
        <Navbar />
        <p className="max-w-3xl mx-auto px-6 py-10 text-neutral-500">
          Loading...
        </p>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="aspect-[2/3] bg-neutral-100 rounded overflow-hidden">
          {book.coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={book.coverUrl}
              alt={book.title}
              className="w-full h-full object-cover"
            />
          )}
        </div>
        <div>
          <h1 className="text-2xl font-semibold">{book.title}</h1>
          <p className="text-neutral-500 mt-1">{book.author}</p>
          <p className="text-xl font-semibold mt-4">₹{book.price}</p>
          <p className="mt-4 text-neutral-600">{book.description}</p>
          <button className="mt-6 px-5 py-2 bg-neutral-900 text-white rounded">
            Add to cart
          </button>
        </div>
      </main>
    </div>
  );
}
