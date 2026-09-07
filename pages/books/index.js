import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import BookCard from "../../components/BookCard";
import api from "../../lib/api";

export default function Books() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get("/books")
      .then((res) => setBooks(res.data))
      .catch(() => setError("Could not load books. Is the backend running?"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold mb-6">Browse books</h1>

        {loading && <p className="text-neutral-500">Loading books...</p>}
        {error && <p className="text-red-600">{error}</p>}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      </main>
    </div>
  );
}
