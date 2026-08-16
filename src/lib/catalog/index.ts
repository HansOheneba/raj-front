import { httpCatalog } from "./http";
import { mockCatalog } from "./mock";
import type { CatalogClient } from "./types";

const catalog: CatalogClient = process.env.NEXT_PUBLIC_API_URL ? httpCatalog : mockCatalog;

export const listDepartments = catalog.listDepartments;
export const getDepartmentBySlug = catalog.getDepartmentBySlug;
export const listProducts = catalog.listProducts;
export const getProductBySlug = catalog.getProductBySlug;
export const getProductById = catalog.getProductById;
export const getRelated = catalog.getRelated;
export const searchProducts = catalog.searchProducts;

export type {
  AttributeMap,
  Department,
  Product,
  ProductListResult,
  ProductQuery,
  ProductVariant,
  SortKey,
} from "./types";
