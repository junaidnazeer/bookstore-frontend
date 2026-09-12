// Converts the backend's raw product shape into what our components expect.
// Centralizing this here means if the backend shape changes again,
// we only fix it in one place.
export function normalizeProduct(p) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    price: parseFloat(p.price),
    image: p.imageUrls && p.imageUrls.length > 0 ? p.imageUrls[0] : null,
    category: p.category?.slug || null,
    categoryName: p.category?.name || null,
    attributes: p.attributes || {},
    stock: p.stock,
  };
}
