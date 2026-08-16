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

const departments = departmentsJson as unknown as Department[];
const products = productsJson as unknown as Product[];

const descendantIds = (slug: string): Set<string> | undefined => {
  const root = departments.find((department) => department.slug === slug);
  if (!root) return undefined;
  const ids = new Set<string>([root.id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const department of departments) {
      if (department.parentId && ids.has(department.parentId) && !ids.has(department.id)) {
        ids.add(department.id);
        grew = true;
      }
    }
  }
  return ids;
};

const sorters: Record<SortKey, (a: Product, b: Product) => number> = {
  featured: (a, b) => (b.popularity ?? 0) - (a.popularity ?? 0),
  popularity: (a, b) => (b.popularity ?? 0) - (a.popularity ?? 0),
  newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
  "price-asc": (a, b) => a.price - b.price,
  "price-desc": (a, b) => b.price - a.price,
};

const filterProducts = (query: ProductQuery = {}): Product[] => {
  const term = query.search?.trim().toLowerCase();
  const departmentIds = query.departmentSlug ? descendantIds(query.departmentSlug) : undefined;

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
    if (term) {
      const haystack = [
        product.name,
        product.brand ?? "",
        product.description,
        ...Object.values(product.attributes),
        ...(product.tags ?? []),
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(term)) return false;
    }
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
    const items = [...filtered].sort(
      (a, b) => Number(b.inStock) - Number(a.inStock) || sorters[sort](a, b) || a.name.localeCompare(b.name),
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
    const { items } = await this.listProducts({ search: term, sort: "popularity" });
    return items.slice(0, limit);
  },
};
