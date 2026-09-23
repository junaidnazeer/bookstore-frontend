export function normalizeProduct(p) {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description,
    price: parseFloat(p.price),
    originalPrice: p.originalPrice ? parseFloat(p.originalPrice) : undefined,
    discountPercent: p.discountPercent || undefined,
    image: p.imageUrls && p.imageUrls.length > 0 ? p.imageUrls[0] : null,
    category: p.category?.slug || null,
    categoryName: p.category?.name || null,
    subcategory: p.subcategory || undefined,
    attributes: {
      ...(p.author ? { author: p.author } : {}),
      ...(p.attributes || {}),
    },
    sizes: p.sizes || [],
    colors: p.colors || [],
    stock: p.stock,
    createdAt: p.createdAt,
  };
}
