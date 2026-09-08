import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import api from "../../lib/api";
import { useCart } from "../../lib/cart-context";

export default function BookDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [book, setBook] = useState(null);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    if (!id) return;
    api
      .get(`/books/${id}`)
      .then((res) => setBook(res.data))
      .catch(() => setBook(null));
  }, [id]);

  function handleAddToCart() {
    addItem(book);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

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
        <div className="aspect-[2/3] bg-neutral-100 rounded overflow-hidden border-l-4 border-spine">
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
          <h1 className="font-serif text-2xl text-ink">{book.title}</h1>
          <p className="text-neutral-500 mt-1">{book.author}</p>
          <p className="text-xl font-semibold mt-4 text-brass">₹{book.price}</p>
          <p className="mt-4 text-neutral-600">{book.description}</p>
          <button
            onClick={handleAddToCart}
            className="mt-6 px-5 py-2 bg-spine text-white rounded hover:opacity-90 transition-opacity"
          >
            {added ? "Added ✓" : "Add to cart"}
          </button>
        </div>
      </main>
    </div>
  );
}
