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

  // Variants: one entry per size/colour combination, each with its own price
  // and stock. Older products have no variants and only a sizes list.
  const variants = (p.variants || []).map((v) => ({
    size: v.size || null,
    color: v.color || null,
    sku: v.sku || null,
    price: v.price != null ? parseFloat(v.price) : price,
    stock: Number.isFinite(Number(v.stock)) ? Number(v.stock) : 0,
  }));
  const unique = (list) => [...new Set(list.filter(Boolean))];
  const variantSizes = unique(variants.map((v) => v.size));
  const variantColors = unique(variants.map((v) => v.color));
  const sizes = variantSizes.length
    ? variantSizes
    : p.attributes?.sizes_available || [];
  const colors = variantColors.length ? variantColors : p.colors || [];

  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description,
    price,
    originalPrice,
    discountPercent,
    image: p.imageUrls && p.imageUrls.length > 0 ? p.imageUrls[0] : null,
    images: p.imageUrls || [],
    category: p.category?.slug || null,
    categoryName: p.category?.name || null,
    subcategory: p.subcategory || undefined,
    brand: p.brand || undefined,
    status: p.status,
    attributes: {
      ...(p.author ? { author: p.author } : {}),
      ...(p.attributes || {}),
    },
    variants,
    sizes,
    colors,
    // True when the customer must pick a size or colour before buying.
    hasOptions: sizes.length > 0 || colors.length > 0,
    stock: p.stock,
    createdAt: p.createdAt,
  };
}
