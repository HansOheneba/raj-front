import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { ShopListing } from "@/components/shop/ShopToolbar";
import { getDepartmentBySlug, listDepartments, listProducts, parentOf } from "@/lib/catalog";
import { parseShopParams, type RawSearchParams } from "@/lib/searchParams";

type PageProps = {
  params: Promise<{ category: string }>;
  searchParams: Promise<RawSearchParams>;
};

export async function generateStaticParams() {
  const departments = await listDepartments();
  return departments.map((department) => ({ category: department.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category: slug } = await params;
  const department = await getDepartmentBySlug(slug);
  if (!department) return { title: "Not found" };
  return {
    title: department.name,
    description: department.description,
  };
}

export default async function DepartmentPage({ params, searchParams }: PageProps) {
  const { category: slug } = await params;
  const department = await getDepartmentBySlug(slug);
  if (!department) notFound();

  const filters = parseShopParams(await searchParams, slug);
  const departments = await listDepartments();
  const { items } = await listProducts({
    departmentSlug: slug,
    search: filters.search || undefined,
    sort: filters.sort,
    inStockOnly: filters.inStockOnly,
    onSaleOnly: filters.onSaleOnly,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
  });

  const parent = parentOf(departments, department);
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/shop" },
    ...(parent ? [{ label: parent.name, href: `/shop/${parent.slug}` }] : []),
    { label: department.name },
  ];

  return (
    <div className="shell py-8">
      <Breadcrumbs items={crumbs} />
      <div className="mt-4 pb-6">
        <SectionHeading
          as="h1"
          title={department.name}
          description={department.description}
          href={parent ? `/shop/${parent.slug}` : "/shop"}
          linkLabel={parent ? parent.name : "All departments"}
        />
      </div>
      <ShopListing departments={departments} lockedDepartment={slug} resultCount={items.length}>
        {items.length === 0 ? (
          <EmptyState title="Nothing in this aisle yet" description="Check back or browse the full shop." />
        ) : (
          <ProductGrid products={items} departments={departments} priorityCount={4} />
        )}
      </ShopListing>
    </div>
  );
}
