import departmentsJson from "@/data/departments.json";
import productsJson from "@/data/products.json";
import type {
  CatalogClient,
  Department,
  Product,
  ProductListResult,
  ProductQuery,
  SortKey,
} from "./types";
import { descendantIds } from "./tree";
import { matchesSearch, rankProducts } from "./search";

const departments = departmentsJson as unknown as Department[];
const products = productsJson as unknown as Product[];

const sorters: Record<SortKey, (a: Product, b: Product) => number> = {
  featured: (a, b) => (b.popularity ?? 0) - (a.popularity ?? 0),
  popularity: (a, b) => (b.popularity ?? 0) - (a.popularity ?? 0),
  newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
  "price-asc": (a, b) => a.price - b.price,
  "price-desc": (a, b) => b.price - a.price,
};

const filterProducts = (query: ProductQuery = {}): Product[] => {
  const term = query.search?.trim();
  const departmentIds = query.departmentSlug
    ? descendantIds(departments, query.departmentSlug)
    : undefined;

  return products.filter((product) => {
    if (departmentIds && !departmentIds.has(product.departmentId)) return false;
    if (query.minPrice !== undefined && product.price < query.minPrice) return false;
    if (query.maxPrice !== undefined && product.price > query.maxPrice) return false;
    if (query.inStockOnly && !product.inStock) return false;
    if (
      query.onSaleOnly &&
      !(product.compareAtPrice && product.compareAtPrice > product.price)
    ) {
      return false;
    }
    if (term && !matchesSearch(product, term, departments)) return false;
    return true;
  });
};

export const mockCatalog: CatalogClient = {
  async listDepartments() {
    return [...departments].sort((a, b) => a.sortOrder - b.sortOrder);
  },

  async getDepartmentBySlug(slug) {
    return departments.find((department) => department.slug === slug);
  },

  async listProducts(query = {}) {
    const sort = query.sort ?? "featured";
    const filtered = filterProducts(query);
    const term = query.search?.trim();
    const items =
      term && (sort === "featured" || sort === "popularity")
        ? rankProducts(filtered, term, departments)
        : [...filtered].sort(
            (a, b) =>
              Number(b.inStock) - Number(a.inStock) ||
              sorters[sort](a, b) ||
              a.name.localeCompare(b.name),
          );
    const prices = products.map((product) => product.price);
    const result: ProductListResult = {
      items,
      total: items.length,
      bounds: { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) },
    };
    return result;
  },

  async getProductBySlug(slug) {
    return products.find((product) => product.slug === slug);
  },

  async getProductById(id) {
    return products.find((product) => product.id === id);
  },

  async getRelated(product, limit = 4) {
    const others = products.filter((item) => item.id !== product.id);
    const same = others.filter((item) => item.departmentId === product.departmentId);
    const rest = others.filter((item) => item.departmentId !== product.departmentId);
    return [...same, ...rest].slice(0, limit);
  },

  async searchProducts(term, limit = 6) {
    return rankProducts(products, term, departments).slice(0, limit);
  },
};
