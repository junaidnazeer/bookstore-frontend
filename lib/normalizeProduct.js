export function normalizeProduct(p) {
  const price = parseFloat(p.price);
  const originalPrice = p.originalPrice
    ? parseFloat(p.originalPrice)
    : undefined;
  // Backend sends originalPrice but not a pre-computed discount percentage —
  // derive it from the two real numbers rather than trusting/inventing a
  // separate field. Only shown when there's an actual price drop.
  const discountPercent =
    originalPrice && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : undefined;

  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description,
    price,
    originalPrice,
    discountPercent,
    image: p.imageUrls && p.imageUrls.length > 0 ? p.imageUrls[0] : null,
    category: p.category?.slug || null,
    categoryName: p.category?.name || null,
    subcategory: p.subcategory || undefined,
    attributes: {
      ...(p.author ? { author: p.author } : {}),
      ...(p.attributes || {}),
    },
    // Per the updated API_REFERENCE.md: sizes live inside attributes as
    // "sizes_available", not as a top-level field. There is no colors data
    // in the backend yet — colors stays an empty array until that exists,
    // which is why product cards never show a color picker right now.
    sizes: p.attributes?.sizes_available || [],
    colors: p.colors || [],
    colors: p.colors || [],
    stock: p.stock,
    createdAt: p.createdAt,
  };
}
