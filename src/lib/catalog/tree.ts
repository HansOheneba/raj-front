import type { Department, Product } from "./types";

export function rootDepartments(departments: Department[]): Department[] {
  return departments
    .filter((department) => department.parentId === null)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function childrenOf(departments: Department[], parentId: string): Department[] {
  return departments
    .filter((department) => department.parentId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function parentOf(
  departments: Department[],
  department: Department,
): Department | undefined {
  if (!department.parentId) return undefined;
  return departments.find((item) => item.id === department.parentId);
}

export function descendantIds(departments: Department[], slug: string): Set<string> | undefined {
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
}

export type MegaMenuProduct = {
  id: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  compareAtPrice?: number;
};

export type MegaMenuItem = {
  id: string;
  slug: string;
  name: string;
  href: string;
  image: string;
  description: string;
  children: MegaMenuItem[];
  featured: MegaMenuProduct[];
};

function toFeatured(product: Product): MegaMenuProduct {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    image: product.imageUrls[0],
    price: product.price,
    compareAtPrice: product.compareAtPrice,
  };
}

function featuredIn(
  departmentId: string,
  departments: Department[],
  products: Product[],
  limit: number,
): MegaMenuProduct[] {
  const ids = descendantIds(
    departments,
    departments.find((department) => department.id === departmentId)?.slug ?? "",
  );
  if (!ids) return [];
  return products
    .filter((product) => ids.has(product.departmentId))
    .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
    .slice(0, limit)
    .map(toFeatured);
}

function toMenuItem(
  department: Department,
  departments: Department[],
  products: Product[],
  featuredLimit: number,
): MegaMenuItem {
  return {
    id: department.id,
    slug: department.slug,
    name: department.name,
    href: `/shop/${department.slug}`,
    image: department.image,
    description: department.description,
    children: childrenOf(departments, department.id).map((child) =>
      toMenuItem(child, departments, products, featuredLimit),
    ),
    featured: featuredIn(department.id, departments, products, featuredLimit),
  };
}

function saleDiscount(product: Product): number {
  if (!product.compareAtPrice || product.compareAtPrice <= product.price) return 0;
  return (product.compareAtPrice - product.price) / product.compareAtPrice;
}

function isOnSale(product: Product): boolean {
  return saleDiscount(product) > 0;
}

function promoProductsIn(
  kind: "sale" | "newest",
  departmentId: string,
  departments: Department[],
  products: Product[],
  limit: number,
): MegaMenuProduct[] {
  const slug = departments.find((department) => department.id === departmentId)?.slug ?? "";
  const ids = descendantIds(departments, slug);
  if (!ids) return [];

  const filtered = products.filter((product) => {
    if (!ids.has(product.departmentId)) return false;
    if (kind === "sale") return isOnSale(product);
    return true;
  });

  const sorted =
    kind === "sale"
      ? [...filtered].sort(
          (a, b) =>
            saleDiscount(b) - saleDiscount(a) || (b.popularity ?? 0) - (a.popularity ?? 0),
        )
      : [...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return sorted.slice(0, limit).map(toFeatured);
}

export function buildPromoMegaMenu(
  kind: "sale" | "newest",
  departments: Department[],
  products: Product[],
  featuredLimit: number,
): MegaMenuItem {
  const isSale = kind === "sale";
  const query = isSale ? "?sale=1" : "?sort=newest";

  const children: MegaMenuItem[] = [];

  for (const root of rootDepartments(departments)) {
    const featured = promoProductsIn(kind, root.id, departments, products, featuredLimit);
    if (featured.length === 0) continue;

    children.push({
      id: `promo-${kind}-${root.id}`,
      slug: root.slug,
      name: root.name,
      href: `/shop/${root.slug}${query}`,
      image: featured[0]?.image ?? root.image,
      description: root.description,
      children: [],
      featured,
    });
  }

  const allFeatured = (
    isSale
      ? products.filter(isOnSale).sort((a, b) => saleDiscount(b) - saleDiscount(a))
      : [...products].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  )
    .slice(0, featuredLimit)
    .map(toFeatured);

  const roots = rootDepartments(departments);

  return {
    id: `promo-${kind}`,
    slug: isSale ? "sale" : "new-arrivals",
    name: isSale ? "On sale" : "New arrivals",
    href: isSale ? "/shop?sale=1" : "/shop?sort=newest",
    image: children[0]?.image ?? allFeatured[0]?.image ?? roots[0]?.image ?? "",
    description: isSale
      ? "Reduced prices on selected lines."
      : "The latest additions across the store.",
    children,
    featured: allFeatured,
  };
}

export function buildMegaMenu(
  departments: Department[],
  products: Product[],
  featuredLimit = 4,
): MegaMenuItem[] {
  return rootDepartments(departments).map((department) =>
    toMenuItem(department, departments, products, featuredLimit),
  );
}
