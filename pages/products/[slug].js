import { useRouter } from "next/router";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { normalizeProduct } from "../../lib/normalizeProduct";
import api from "../../lib/api";
import { useCart } from "../../lib/cart-context";
import { useWishlist } from "../../lib/wishlist-context";
import { useShipping } from "../../lib/useShipping";
import {
  Heart,
  Minus,
  Plus,
  ArrowLeft,
  Search as SearchIcon,
  SlidersHorizontal,
  ShieldCheck,
  Lock,
  RefreshCcw,
  Truck,
  ShoppingCart,
} from "lucide-react";

const SPINE = "#1e3d32";

const DISPLAY_ATTRIBUTES = {
  books: ["author", "language"],
  attars: ["volume_ml", "scent_notes"],
  "shalwar-kameez": ["fabric"],
  abayas: ["fabric"],
  jilbabs: ["fabric"],
  caps: ["fabric"],
};

// Compact header: back arrow, the product's category (e.g. "Books"), a
// search shortcut, a shortcut into this same category's product list, and
// the cart (with live badge) so the user never has to go back to Home to
// reach it. No login link here — cart access never requires being logged in.
function DetailHeader({ router, title, categorySlug, cartCount }) {
  return (
    <header className="flex items-center gap-3 px-4 py-4 max-w-3xl mx-auto">
      <button
        onClick={() => router.back()}
        aria-label="Go back"
        className="flex-shrink-0"
        style={{ color: SPINE }}
      >
        <ArrowLeft size={22} />
      </button>
      {title && (
        <h1
          className="font-serif text-lg font-semibold truncate flex-1"
          style={{ color: SPINE }}
        >
          {title}
        </h1>
      )}
      <div
        className="flex items-center gap-4 flex-shrink-0"
        style={{ color: SPINE }}
      >
        <Link href="/search" aria-label="Search">
          <SearchIcon size={20} />
        </Link>

        <Link href="/cart" aria-label="Cart" className="relative">
          <ShoppingCart size={20} />
          {cartCount > 0 && (
            <span
              className="absolute -top-1.5 -right-1.5 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full"
              style={{ backgroundColor: SPINE }}
            >
              {cartCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}

function RelatedProductCard({ product }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="border border-neutral-200 rounded-lg bg-white p-3 block"
    >
      <div className="aspect-square bg-neutral-100 rounded overflow-hidden mb-2">
        {product.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        )}
      </div>
      <p className="text-sm font-medium text-ink truncate">{product.name}</p>
      <p className="text-spine font-semibold text-sm">₹{product.price}</p>
    </Link>
  );
}

function DetailSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-square bg-neutral-200 rounded-2xl mb-4" />
      <div className="h-6 bg-neutral-200 rounded w-3/4 mb-3" />
      <div className="h-3 bg-neutral-200 rounded w-1/4 mb-4" />
      <div className="h-8 bg-neutral-200 rounded w-1/3 mb-4" />
      <div className="h-3 bg-neutral-200 rounded w-full mb-2" />
      <div className="h-3 bg-neutral-200 rounded w-5/6 mb-6" />
      <div className="h-10 bg-neutral-200 rounded" />
    </div>
  );
}

// Generic store-wide policy content — same for every product, not
// per-product data, so it's fine to state here rather than pull from the API.
function TrustBadges() {
  const badges = [
    { icon: ShieldCheck, label: "Authentic Product" },
    { icon: Lock, label: "Secure Payment" },
    { icon: RefreshCcw, label: "Easy Returns" },
  ];
  return (
    <div className="grid grid-cols-3 gap-2 mt-5">
      {badges.map(({ icon: Icon, label }) => (
        <div
          key={label}
          className="flex flex-col items-center text-center gap-1.5 py-3 px-1 rounded-xl bg-white border border-neutral-100"
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "rgba(30,61,50,0.08)" }}
          >
            <Icon size={16} style={{ color: SPINE }} />
          </div>
          <p className="text-[11px] text-neutral-600 leading-tight">{label}</p>
        </div>
      ))}
    </div>
  );
}

function DeliveryInfo() {
  const { loaded, charge, threshold, deliveryEstimate } = useShipping();
  const fee = !loaded
    ? ""
    : charge > 0
      ? threshold > 0
        ? `₹${charge} delivery · free above ₹${threshold}`
        : `₹${charge} delivery`
      : "Free delivery";
  return (
    <div className="flex items-center gap-3 mt-4 p-3 rounded-xl bg-white border border-neutral-100">
      <Truck size={20} style={{ color: SPINE }} className="flex-shrink-0" />
      <div>
        <p className="text-sm font-medium text-ink">Delivery Information</p>
        <p className="text-xs text-neutral-500">
          {[deliveryEstimate || "2-5 working days", fee]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
    </div>
  );
}

export default function ProductDetail() {
  const router = useRouter();
  const { slug } = router.query;
  const [product, setProduct] = useState(null);
  const [status, setStatus] = useState("loading"); // "loading" | "success" | "notfound" | "error"
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [sizeError, setSizeError] = useState(false);
  const [colorError, setColorError] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);
  const { addItem, count } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();

  const fetchProduct = useCallback(() => {
    if (!slug) return;
    setStatus("loading");
    setActiveImage(0);
    api
      .get(`/products/${slug}`)
      .then((res) => {
        setProduct(normalizeProduct(res.data));
        setStatus("success");
      })
      .catch((err) => {
        // Distinguish "doesn't exist" from a real network/server failure so
        // the user gets an accurate message instead of infinite "Loading...".
        if (err?.response?.status === 404) {
          setStatus("notfound");
        } else {
          setStatus("error");
        }
      });
  }, [slug]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  useEffect(() => {
    if (!product?.category) return;
    api
      .get(`/products?category=${product.category}`)
      .then((res) => {
        const others = res.data
          .map(normalizeProduct)
          .filter((p) => p.id !== product.id)
          .slice(0, 4);
        setRelatedProducts(others);
      })
      .catch(() => setRelatedProducts([]));
  }, [product]);

  function handleAddToCart() {
    if (product.sizes?.length > 0 && !selectedSize) {
      setSizeError(true);
      document
        .getElementById("size-section")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (product.colors?.length > 0 && !selectedColor) {
      setColorError(true);
      document
        .getElementById("color-section")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const unit = selectedVariant ? selectedVariant.price : product.price;
    addItem({
      ...product,
      price: unit,
      originalPrice:
        product.originalPrice > unit ? product.originalPrice : undefined,
      stock: selectedVariant ? selectedVariant.stock : product.stock,
      perVariant: Boolean(selectedVariant),
      size: selectedSize,
      color: selectedColor,
      quantity,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }
  if (status === "loading") {
    return (
      <div>
        <DetailHeader router={router} cartCount={count} />
        <main className="max-w-3xl mx-auto px-4 py-2">
          <DetailSkeleton />
        </main>
      </div>
    );
  }

  if (status === "notfound") {
    return (
      <div>
        <DetailHeader router={router} cartCount={count} />
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <p className="text-ink font-medium mb-2">Product not found.</p>
          <p className="text-neutral-500 text-sm mb-5">
            This item may have been removed or the link is incorrect.
          </p>
          <Link
            href="/products"
            className="inline-block px-4 py-2 rounded text-sm text-white hover:opacity-90 transition-opacity"
            style={{ backgroundColor: SPINE }}
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div>
        <DetailHeader router={router} cartCount={count} />
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <p className="text-red-600 mb-3">
            Something went wrong loading this product.
          </p>
          <button
            onClick={fetchProduct}
            className="px-4 py-2 rounded text-sm text-white hover:opacity-90 transition-opacity"
            style={{ backgroundColor: SPINE }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const needsVariants =
    (product.sizes && product.sizes.length > 0) ||
    (product.colors && product.colors.length > 0);
  const attributeKeys = DISPLAY_ATTRIBUTES[product.category] || [];
  const attributes = product.attributes || {};
  const wishlisted = isWishlisted(product.id);
  const variants = product.variants || [];
  const hasVariants = variants.length > 0;
  const sizeList = product.sizes || [];
  const colorList = product.colors || [];
  // The variant that matches what the customer picked (null until they have
  // picked everything this product needs).
  const selectedVariant =
    hasVariants &&
    (sizeList.length === 0 || selectedSize) &&
    (colorList.length === 0 || selectedColor)
      ? variants.find(
          (v) =>
            (v.size || null) === (selectedSize || null) &&
            (v.color || null) === (selectedColor || null),
        ) || null
      : null;
  // A size or colour is greyed out when nothing in stock matches it.
  const sizeInStock = (size) =>
    !hasVariants ||
    variants.some(
      (v) =>
        v.size === size &&
        (!selectedColor || v.color === selectedColor) &&
        v.stock > 0,
    );
  const colorInStock = (color) =>
    !hasVariants ||
    variants.some(
      (v) =>
        v.color === color &&
        (!selectedSize || v.size === selectedSize) &&
        v.stock > 0,
    );
  const variantPrices = variants.map((v) => v.price).filter(Number.isFinite);
  const lowestPrice = variantPrices.length ? Math.min(...variantPrices) : null;
  const pricesDiffer =
    lowestPrice !== null && Math.max(...variantPrices) !== lowestPrice;
  const showFrom = !selectedVariant && pricesDiffer;
  const unitPrice = selectedVariant
    ? selectedVariant.price
    : showFrom
      ? lowestPrice
      : product.price;
  const shownOriginal =
    !showFrom && product.originalPrice > unitPrice
      ? product.originalPrice
      : null;
  const shownDiscount = shownOriginal
    ? Math.round(((shownOriginal - unitPrice) / shownOriginal) * 100)
    : null;
  const stockNow = selectedVariant ? selectedVariant.stock : product.stock;
  const inStock = stockNow > 0 && product.status !== "OUT_OF_STOCK";
  const gallery =
    product.images && product.images.length > 0 ? product.images : [];

  const SWIPE_THRESHOLD = 40; // px — ignore tiny accidental drags

  function handleTouchStart(e) {
    setTouchStartX(e.touches[0].clientX);
  }

  function handleTouchEnd(e) {
    if (touchStartX === null || gallery.length < 2) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
      if (deltaX < 0) {
        // swiped left -> next image
        setActiveImage((i) => (i + 1) % gallery.length);
      } else {
        // swiped right -> previous image
        setActiveImage((i) => (i - 1 + gallery.length) % gallery.length);
      }
    }
    setTouchStartX(null);
  }

  return (
    <div style={{ backgroundColor: "#F3ECDD" }} className="min-h-screen">
      <DetailHeader
        router={router}
        title={product.categoryName}
        categorySlug={product.category}
        cartCount={count}
      />
      <main className="max-w-3xl mx-auto px-4 pb-8">
        {/* Image + gallery counter */}
        <div
          className="relative"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="aspect-square bg-neutral-100 rounded-2xl overflow-hidden">
            {gallery[activeImage] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={gallery[activeImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <button
            onClick={() => toggleWishlist(product)}
            className="absolute top-3 right-3 bg-white/90 rounded-full p-2"
            aria-label="Toggle wishlist"
          >
            <Heart
              size={18}
              className={
                wishlisted ? "fill-red-500 text-red-500" : "text-neutral-400"
              }
            />
          </button>
          {gallery.length > 1 && (
            <span className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
              {activeImage + 1}/{gallery.length}
            </span>
          )}
          {gallery.length > 1 && (
            <div className="flex gap-1.5 mt-2 justify-center">
              {gallery.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  aria-label={`View image ${i + 1}`}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    backgroundColor: i === activeImage ? SPINE : "#d4cfc4",
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <h2 className="font-serif text-xl text-ink mt-4">{product.name}</h2>

        {attributeKeys.map((key) =>
          attributes[key] ? (
            <p key={key} className="text-sm text-neutral-500 mt-1">
              <span className="capitalize">{key.replace(/_/g, " ")}</span>:{" "}
              {attributes[key]}
            </p>
          ) : null,
        )}

        <div className="flex items-center gap-2 mt-2">
          <p className="text-2xl font-semibold" style={{ color: SPINE }}>
            {showFrom ? "From " : ""}₹{unitPrice}
          </p>
          {shownOriginal && (
            <>
              <p className="text-sm text-neutral-400 line-through">
                ₹{shownOriginal}
              </p>
              {shownDiscount > 0 && (
                <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                  {shownDiscount}% OFF
                </span>
              )}
            </>
          )}
        </div>

        <p
          className={`text-sm mt-1 ${inStock ? "text-green-600" : "text-red-600"}`}
        >
          {!inStock
            ? "Out of stock"
            : stockNow <= 5
              ? `Only ${stockNow} left`
              : `In stock (${stockNow} available)`}
        </p>

        <h3 className="font-medium text-ink mt-5 mb-1">Product Details</h3>
        <p className="text-neutral-600 text-sm">{product.description}</p>

        <TrustBadges />

        {sizeList.length > 0 && (
          <div id="size-section" className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-ink">
                Size
                {selectedSize && (
                  <span className="text-neutral-500 font-normal">
                    {" "}
                    : {selectedSize}
                  </span>
                )}
              </p>
              {attributes.size_guide && (
                <button
                  onClick={() => setShowGuide((v) => !v)}
                  className="text-sm underline"
                  style={{ color: SPINE }}
                >
                  Size guide
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {sizeList.map((size) => {
                const available = sizeInStock(size);
                const active = selectedSize === size;
                return (
                  <button
                    key={size}
                    disabled={!available}
                    onClick={() => {
                      setSelectedSize(active ? null : size);
                      setSizeError(false);
                      setQuantity(1);
                    }}
                    className={`min-w-[48px] h-10 px-3 rounded-lg border text-sm transition-colors ${
                      !available
                        ? "border-neutral-200 text-neutral-300 line-through cursor-not-allowed"
                        : active
                          ? "text-white"
                          : "border-neutral-300 text-ink hover:border-neutral-500"
                    }`}
                    style={
                      active && available
                        ? { backgroundColor: SPINE, borderColor: SPINE }
                        : {}
                    }
                  >
                    {size}
                  </button>
                );
              })}
            </div>
            {sizeError && (
              <p className="text-sm text-red-600 mt-2">Please select a size</p>
            )}
            {showGuide && attributes.size_guide && (
              <p className="text-sm text-neutral-600 bg-white border border-neutral-200 rounded-lg p-3 mt-3">
                {attributes.size_guide}
              </p>
            )}
          </div>
        )}

        {colorList.length > 0 && (
          <div id="color-section" className="mt-5">
            <p className="text-sm font-medium text-ink mb-2">
              Colour
              {selectedColor && (
                <span className="text-neutral-500 font-normal">
                  {" "}
                  : {selectedColor}
                </span>
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              {colorList.map((color) => {
                const available = colorInStock(color);
                const active = selectedColor === color;
                return (
                  <button
                    key={color}
                    disabled={!available}
                    onClick={() => {
                      setSelectedColor(active ? null : color);
                      setColorError(false);
                      setQuantity(1);
                    }}
                    className={`h-10 px-3 rounded-lg border text-sm transition-colors ${
                      !available
                        ? "border-neutral-200 text-neutral-300 line-through cursor-not-allowed"
                        : active
                          ? "text-white"
                          : "border-neutral-300 text-ink hover:border-neutral-500"
                    }`}
                    style={
                      active && available
                        ? { backgroundColor: SPINE, borderColor: SPINE }
                        : {}
                    }
                  >
                    {color}
                  </button>
                );
              })}
            </div>
            {colorError && (
              <p className="text-sm text-red-600 mt-2">
                Please select a colour
              </p>
            )}
          </div>
        )}

        {/* Quantity + Add to Cart in one row */}
        <div className="flex items-center gap-3 mt-5">
          <div className="flex items-center border border-neutral-300 rounded-lg flex-shrink-0">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="p-2.5"
              aria-label="Decrease quantity"
            >
              <Minus size={14} />
            </button>
            <span className="px-3 text-sm w-6 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => Math.min(stockNow || 1, q + 1))}
              className="p-2.5"
              aria-label="Increase quantity"
            >
              <Plus size={14} />
            </button>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={!inStock}
            className="flex-1 px-5 py-2.5 rounded-lg text-white hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: SPINE }}
          >
            {!inStock ? "Out of Stock" : added ? "Added ✓" : "Add to Cart"}
          </button>
        </div>

        <DeliveryInfo />

        {relatedProducts.length > 0 && (
          <section className="mt-8">
            <h2 className="font-serif text-lg text-ink mb-3">
              Related Products
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {relatedProducts.map((p) => (
                <RelatedProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
