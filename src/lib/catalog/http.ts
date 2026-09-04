import { apiPublic, apiPublicOptional } from "@/lib/api";
import type { CatalogClient, Department, Product, ProductListResult, ProductQuery } from "./types";

/** Shown when the portal has a record with no artwork yet. */
const IMAGE_FALLBACK = "/logos/raj-logo.png";

function queryString(query: ProductQuery): string {
  const params = new URLSearchParams();
  if (query.departmentSlug) params.set("department", query.departmentSlug);
  if (query.search) params.set("q", query.search);
  if (query.minPrice !== undefined) params.set("min", String(query.minPrice));
  if (query.maxPrice !== undefined) params.set("max", String(query.maxPrice));
  if (query.inStockOnly) params.set("stock", "1");
  if (query.onSaleOnly) params.set("sale", "1");
  if (query.sort) params.set("sort", query.sort);
  const encoded = params.toString();
  return encoded ? `?${encoded}` : "";
}

/** Components index imageUrls[0] directly, so every product needs at least one image. */
function withImages(product: Product): Product {
  const imageUrls = Array.isArray(product.imageUrls)
    ? product.imageUrls.filter((url) => Boolean(url))
    : [];
  return imageUrls.length > 0 ? { ...product, imageUrls } : { ...product, imageUrls: [IMAGE_FALLBACK] };
}

function withDepartmentImage(department: Department): Department {
  return department.image ? department : { ...department, image: IMAGE_FALLBACK };
}

export const httpCatalog: CatalogClient = {
  listDepartments: async () =>
    (await apiPublic<Department[]>("/catalog/departments")).map(withDepartmentImage),

  getDepartmentBySlug: async (slug) => {
    const department = await apiPublicOptional<Department>(`/catalog/departments/${slug}`);
    return department ? withDepartmentImage(department) : undefined;
  },

  listProducts: async (query = {}) => {
    const result = await apiPublic<ProductListResult>(`/catalog/products${queryString(query)}`);
    return { ...result, items: result.items.map(withImages) };
  },

  getProductBySlug: async (slug) => {
    const product = await apiPublicOptional<Product>(`/catalog/products/${slug}`);
    return product ? withImages(product) : undefined;
  },

  getProductById: async (id) => {
    const product = await apiPublicOptional<Product>(`/catalog/products/id/${id}`);
    return product ? withImages(product) : undefined;
  },

  getRelated: async (product, limit = 4) =>
    (await apiPublic<Product[]>(`/catalog/products/${product.slug}/related?limit=${limit}`)).map(
      withImages,
    ),

  searchProducts: async (term, limit = 6) =>
    (
      await apiPublic<Product[]>(
        `/catalog/search?q=${encodeURIComponent(term)}&limit=${limit}`,
      )
    ).map(withImages),
};
