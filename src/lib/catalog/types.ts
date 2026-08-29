export type SortKey = "featured" | "newest" | "price-asc" | "price-desc" | "popularity";

export type AttributeMap = Record<string, string>;

export type Department = {
  id: string;
  slug: string;
  name: string;
  parentId: string | null;
  sortOrder: number;
  image: string;
  description: string;
};

export type ProductVariant = {
  id: string;
  sku: string;
  attributes: AttributeMap;
  price: number;
  stock: number;
  imageUrls?: string[];
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  departmentId: string;
  brand?: string;
  description: string;
  imageUrls: string[];
  price: number;
  compareAtPrice?: number;
  inStock: boolean;
  createdAt: string;
  popularity?: number;
  attributes: AttributeMap;
  variants?: ProductVariant[];
  tags?: string[];
  keywords?: string[];
};

export type ProductQuery = {
  departmentSlug?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  onSaleOnly?: boolean;
  sort?: SortKey;
};

export type ProductListResult = {
  items: Product[];
  total: number;
  bounds: { min: number; max: number };
};

export type CatalogClient = {
  listDepartments: () => Promise<Department[]>;
  getDepartmentBySlug: (slug: string) => Promise<Department | undefined>;
  listProducts: (query?: ProductQuery) => Promise<ProductListResult>;
  getProductBySlug: (slug: string) => Promise<Product | undefined>;
  getProductById: (id: string) => Promise<Product | undefined>;
  getRelated: (product: Product, limit?: number) => Promise<Product[]>;
  searchProducts: (term: string, limit?: number) => Promise<Product[]>;
};
