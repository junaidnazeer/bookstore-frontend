import api from "./api";
import { isUnsupported, toArray } from "./admin";

// Loads the category list for admin screens.
//
// The admin endpoint includes categories that are switched off (isActive: false)
// and their product counts, so the product forms and filters can still reach
// every category. If the backend doesn't have it, fall back to the public list
// and report `admin: false` so the Categories page stays read-only.
export async function fetchCategories() {
  try {
    const res = await api.get("/admin/categories");
    return { categories: toArray(res.data), admin: true };
  } catch (err) {
    if (!isUnsupported(err)) throw err;
    const res = await api.get("/categories");
    return { categories: toArray(res.data), admin: false };
  }
}
