import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { ShopListing } from "@/components/shop/ShopToolbar";
import { listDepartments, listProducts } from "@/lib/catalog";
import { parseShopParams, type RawSearchParams } from "@/lib/searchParams";

export const metadata: Metadata = {
  title: "Shop",
  description: "Browse everyday essentials, beauty, fashion and hard-to-find favourites.",
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const filters = parseShopParams(await searchParams);
  const departments = await listDepartments();
  const { items } = await listProducts({
    departmentSlug: filters.departmentSlug,
    search: filters.search || undefined,
    sort: filters.sort,
    inStockOnly: filters.inStockOnly,
    onSaleOnly: filters.onSaleOnly,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
  });

  return (
    <div className="shell py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Shop" }]} />
      <div className="mt-4 pb-6">
        <SectionHeading
          as="h1"
          eyebrow="Catalogue"
          title={filters.search ? `Results for “${filters.search}”` : "Shop"}
          description="Browse by department, or search for what you need."
        />
      </div>
      <ShopListing departments={departments} resultCount={items.length}>
        {items.length === 0 ? (
          <EmptyState title="No matches" description="Try another department or clear the filters." />
        ) : (
          <ProductGrid products={items} departments={departments} priorityCount={4} />
        )}
      </ShopListing>
    </div>
  );
}
