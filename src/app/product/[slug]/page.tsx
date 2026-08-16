import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProductPurchase } from "@/components/catalog/ProductPurchase";
import { ProductRail } from "@/components/catalog/ProductRail";
import {
  getProductBySlug,
  getRelated,
  listDepartments,
  listProducts,
} from "@/lib/catalog";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const { items } = await listProducts();
  return items.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Not found" };
  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [{ url: product.imageUrls[0] }],
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const departments = await listDepartments();
  const department = departments.find((item) => item.id === product.departmentId);
  const related = await getRelated(product, 5);

  return (
    <div className="shell py-8">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Shop", href: "/shop" },
          ...(department
            ? [{ label: department.name, href: `/shop/${department.slug}` }]
            : []),
          { label: product.name },
        ]}
      />

      <ProductPurchase
        product={product}
        department={department ? { name: department.name, slug: department.slug } : undefined}
      />

      {department && (
        <section className="mt-20">
          <SectionHeading
            eyebrow="Same aisle"
            title={`More from ${department.name}`}
            href={`/shop/${department.slug}`}
            linkLabel={`All ${department.name.toLowerCase()}`}
          />
          <div className="mt-6">
            <ProductRail products={related} departments={departments} />
          </div>
        </section>
      )}
    </div>
  );
}
