import type { Department, Product } from "./types";

const STOP_WORDS = new Set(["a", "an", "and", "for", "in", "of", "or", "the", "to", "with"]);

const QUERY_SYNONYMS: Record<string, readonly string[]> = {
  attar: ["perfume", "fragrance", "oil"],
  bag: ["handbag", "purse", "shoulder"],
  cologne: ["perfume", "fragrance", "parfum"],
  detergent: ["laundry", "soap"],
  dress: ["dresses"],
  dresses: ["dress"],
  edt: ["perfume", "fragrance", "toilette"],
  edp: ["perfume", "fragrance", "parfum"],
  footwear: ["shoes", "sneakers", "slides", "loafer"],
  fragrance: ["perfume", "parfum", "scent", "attar"],
  loafer: ["loafers", "shoes"],
  loafers: ["loafer", "shoes"],
  milk: ["dairy"],
  oil: ["oils"],
  oils: ["oil"],
  parfum: ["perfume", "fragrance", "edp"],
  perfume: ["parfum", "fragrance", "edt", "edp", "attar", "cologne", "scent", "mist"],
  rice: ["grain", "grains"],
  sandal: ["sandals", "slides", "shoes"],
  sandals: ["slides", "shoes"],
  scent: ["perfume", "fragrance", "parfum"],
  shoe: ["shoes", "sneakers", "slides", "loafer", "footwear"],
  shoes: ["sneakers", "trainers", "slides", "loafer", "loafers", "footwear"],
  slides: ["slippers", "sandals", "shoes"],
  slippers: ["slides", "shoes"],
  sneakers: ["trainers", "shoes", "kicks"],
  soap: ["laundry", "detergent"],
  trainers: ["sneakers", "shoes"],
  yogurt: ["yoghurt", "dairy"],
  yoghurt: ["yogurt", "dairy"],
};

const FIELD_WEIGHT = {
  name: 10,
  keyword: 8,
  sku: 9,
  brand: 6,
  tag: 5,
  department: 4,
  attribute: 3,
  description: 2,
} as const;

export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

export function tokenize(value: string): string[] {
  const normalized = normalizeText(value).replace(/[^a-z0-9]+/g, " ").trim();
  if (!normalized) return [];
  return normalized.split(/\s+/).filter((token) => token.length > 0 && !STOP_WORDS.has(token));
}

function expandToken(token: string): string[] {
  const synonyms = QUERY_SYNONYMS[token];
  return synonyms ? [token, ...synonyms] : [token];
}

type IndexedField = {
  tokens: string[];
  weight: number;
};

function indexProduct(product: Product, departmentNames: string[]): IndexedField[] {
  const skuValues = (product.variants ?? []).flatMap((variant) => [
    variant.sku,
    ...Object.values(variant.attributes),
  ]);

  return [
    { tokens: tokenize(product.name), weight: FIELD_WEIGHT.name },
    { tokens: tokenize((product.keywords ?? []).join(" ")), weight: FIELD_WEIGHT.keyword },
    { tokens: tokenize(skuValues.join(" ")), weight: FIELD_WEIGHT.sku },
    { tokens: tokenize(product.brand ?? ""), weight: FIELD_WEIGHT.brand },
    { tokens: tokenize((product.tags ?? []).join(" ")), weight: FIELD_WEIGHT.tag },
    { tokens: tokenize(departmentNames.join(" ")), weight: FIELD_WEIGHT.department },
    { tokens: tokenize(Object.values(product.attributes).join(" ")), weight: FIELD_WEIGHT.attribute },
    { tokens: tokenize(product.description), weight: FIELD_WEIGHT.description },
  ].filter((field) => field.tokens.length > 0);
}

function tokenScore(needle: string, haystack: string[]): number {
  let best = 0;
  for (const candidate of haystack) {
    if (candidate === needle) {
      best = Math.max(best, 1);
      if (best === 1) return 1;
      continue;
    }
    if (candidate.startsWith(needle) && needle.length >= 2) {
      best = Math.max(best, 0.72);
      continue;
    }
    if (needle.length >= 3 && candidate.includes(needle)) {
      best = Math.max(best, 0.4);
    }
  }
  return best;
}

function skuHaystack(product: Product): string[] {
  return (product.variants ?? []).map((variant) => normalizeText(variant.sku).replace(/[^a-z0-9]/g, ""));
}

export function departmentNamesFor(product: Product, departments: Department[]): string[] {
  const current = departments.find((department) => department.id === product.departmentId);
  if (!current) return [];
  const parent = current.parentId
    ? departments.find((department) => department.id === current.parentId)
    : undefined;
  return parent ? [current.name, parent.name] : [current.name];
}

export function scoreProduct(product: Product, query: string, departments: Department[]): number {
  const trimmed = query.trim();
  if (!trimmed) return 0;

  const compactQuery = normalizeText(trimmed).replace(/[^a-z0-9]/g, "");
  if (compactQuery.length >= 3 && skuHaystack(product).some((sku) => sku.includes(compactQuery))) {
    return 100 + (product.popularity ?? 0) / 100;
  }

  const queryTokens = tokenize(trimmed);
  if (queryTokens.length === 0) return 0;

  const fields = indexProduct(product, departmentNamesFor(product, departments));
  if (fields.length === 0) return 0;

  let total = 0;
  for (const token of queryTokens) {
    let best = 0;
    for (const variant of expandToken(token)) {
      for (const field of fields) {
        const hit = tokenScore(variant, field.tokens);
        if (hit > 0) best = Math.max(best, hit * field.weight);
      }
    }
    if (best === 0) return 0;
    total += best;
  }

  const popularityBoost = (product.popularity ?? 0) / 100;
  const inStockBoost = product.inStock ? 0.5 : 0;
  return total + popularityBoost + inStockBoost;
}

export function matchesSearch(product: Product, query: string, departments: Department[]): boolean {
  return scoreProduct(product, query, departments) > 0;
}

export function rankProducts(
  products: Product[],
  query: string,
  departments: Department[],
): Product[] {
  return products
    .map((product) => ({ product, score: scoreProduct(product, query, departments) }))
    .filter((entry) => entry.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        (b.product.popularity ?? 0) - (a.product.popularity ?? 0) ||
        a.product.name.localeCompare(b.product.name),
    )
    .map((entry) => entry.product);
}

export function matchDepartments(departments: Department[], query: string, limit = 4): Department[] {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  return departments
    .map((department) => {
      const haystack = tokenize(`${department.name} ${department.description}`);
      let score = 0;
      for (const token of queryTokens) {
        let best = 0;
        for (const variant of expandToken(token)) {
          best = Math.max(best, tokenScore(variant, haystack));
        }
        if (best === 0) return { department, score: 0 };
        score += best * (department.parentId ? 1 : 1.15);
      }
      return { department, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.department.sortOrder - b.department.sortOrder)
    .slice(0, limit)
    .map((entry) => entry.department);
}
