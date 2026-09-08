import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import api from "../../lib/api";
import { useCart } from "../../lib/cart-context";

export default function ProductDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [product, setProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    if (!id) return;
    api
      .get(`/products/${id}`)
      .then((res) => setProduct(res.data))
      .catch(() => setProduct(null));
  }, [id]);

  function handleAddToCart() {
    addItem({ ...product, size: selectedSize, color: selectedColor });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  if (!product) {
    return (
      <div>
        <Navbar />
        <p className="max-w-3xl mx-auto px-6 py-10 text-neutral-500">
          Loading...
        </p>
      </div>
    );
  }

  const needsVariants =
    (product.sizes && product.sizes.length > 0) ||
    (product.colors && product.colors.length > 0);

  return (
    <div>
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="aspect-square bg-neutral-100 rounded overflow-hidden border-l-4 border-spine">
          {product.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          )}
        </div>

        <div>
          <h1 className="font-serif text-2xl text-ink">{product.name}</h1>

          {product.category === "books" && product.author && (
            <p className="text-neutral-500 mt-1">{product.author}</p>
          )}

          <p className="text-xl font-semibold mt-4 text-brass">
            ₹{product.price}
          </p>
          <p className="mt-4 text-neutral-600">{product.description}</p>

          {product.sizes && product.sizes.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-neutral-500 mb-1">Size</p>
              <div className="flex gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-3 py-1 rounded border text-sm ${
                      selectedSize === size
                        ? "bg-spine text-white border-spine"
                        : "border-neutral-300 text-ink"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.colors && product.colors.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-neutral-500 mb-1">Color</p>
              <div className="flex gap-2">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-3 py-1 rounded border text-sm ${
                      selectedColor === color
                        ? "bg-spine text-white border-spine"
                        : "border-neutral-300 text-ink"
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleAddToCart}
            disabled={
              needsVariants &&
              ((product.sizes?.length > 0 && !selectedSize) ||
                (product.colors?.length > 0 && !selectedColor))
            }
            className="mt-6 px-5 py-2 bg-spine text-white rounded hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {added ? "Added ✓" : "Add to cart"}
          </button>
        </div>
      </main>
    </div>
  );
}
