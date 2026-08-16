import type { CatalogClient, Department, Product, ProductListResult, ProductQuery } from "./types";

const baseUrl = () => {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_API_URL is not set");
  }
  return url.replace(/\/$/, "");
};

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${baseUrl()}${path}`, { next: { revalidate: 60 } });
  if (!response.ok) {
    throw new Error(`Admin catalog request failed: ${response.status} ${path}`);
  }
  return response.json() as Promise<T>;
}

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

export const httpCatalog: CatalogClient = {
  listDepartments: () => getJson<Department[]>("/catalog/departments"),
  getDepartmentBySlug: (slug) => getJson<Department | undefined>(`/catalog/departments/${slug}`),
  listProducts: (query = {}) => getJson<ProductListResult>(`/catalog/products${queryString(query)}`),
  getProductBySlug: (slug) => getJson<Product | undefined>(`/catalog/products/${slug}`),
  getProductById: (id) => getJson<Product | undefined>(`/catalog/products/id/${id}`),
  getRelated: (product, limit = 4) =>
    getJson<Product[]>(`/catalog/products/${product.slug}/related?limit=${limit}`),
  searchProducts: (term, limit = 6) =>
    getJson<Product[]>(`/catalog/search?q=${encodeURIComponent(term)}&limit=${limit}`),
};
