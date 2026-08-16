import type { SortKey } from "@/lib/catalog";

export type RawSearchParams = Record<string, string | string[] | undefined>;

export type ShopFilters = {
  departmentSlug?: string;
  sort: SortKey;
  search: string;
  inStockOnly: boolean;
  onSaleOnly: boolean;
  minPrice?: number;
  maxPrice?: number;
};

const sortKeys: SortKey[] = ["featured", "newest", "popularity", "price-asc", "price-desc"];

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const number = (value: string | undefined) => {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export function parseShopParams(params: RawSearchParams, lockedDepartment?: string): ShopFilters {
  const sort = first(params.sort);
  return {
    departmentSlug: lockedDepartment ?? first(params.department)?.trim() ?? undefined,
    sort: sortKeys.includes(sort as SortKey) ? (sort as SortKey) : "featured",
    search: first(params.q)?.trim() ?? "",
    inStockOnly: first(params.stock) === "1",
    onSaleOnly: first(params.sale) === "1",
    minPrice: number(first(params.min)),
    maxPrice: number(first(params.max)),
  };
}
