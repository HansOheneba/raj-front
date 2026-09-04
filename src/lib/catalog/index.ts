import { isApiEnabled } from "@/lib/api";
import { httpCatalog } from "./http";
import { mockCatalog } from "./mock";
import { buildMegaMenu, buildPromoMegaMenu, type MegaMenuItem } from "./tree";
import type { CatalogClient } from "./types";

const catalog: CatalogClient = isApiEnabled ? httpCatalog : mockCatalog;

export type MegaMenuData = {
  departments: MegaMenuItem[];
  sale: MegaMenuItem;
  newest: MegaMenuItem;
};

export const listDepartments = catalog.listDepartments;
export const getDepartmentBySlug = catalog.getDepartmentBySlug;
export const listProducts = catalog.listProducts;
export const getProductBySlug = catalog.getProductBySlug;
export const getProductById = catalog.getProductById;
export const getRelated = catalog.getRelated;
export const searchProducts = catalog.searchProducts;

export async function getMegaMenu(): Promise<MegaMenuData> {
  const [departments, { items }] = await Promise.all([
    catalog.listDepartments(),
    catalog.listProducts(),
  ]);
  const featuredLimit = 6;
  return {
    departments: buildMegaMenu(departments, items, featuredLimit),
    sale: buildPromoMegaMenu("sale", departments, items, featuredLimit),
    newest: buildPromoMegaMenu("newest", departments, items, featuredLimit),
  };
}

export type {
  AttributeMap,
  Department,
  Product,
  ProductListResult,
  ProductQuery,
  ProductVariant,
  SortKey,
} from "./types";

export type { MegaMenuItem, MegaMenuProduct } from "./tree";
export { childrenOf, parentOf, rootDepartments } from "./tree";
export { matchDepartments } from "./search";
