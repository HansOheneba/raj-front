import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock, MapPin, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { DepartmentCard } from "@/components/catalog/DepartmentCard";
import { ProductRail } from "@/components/catalog/ProductRail";
import { listDepartments, listProducts } from "@/lib/catalog";
import { siteConfig } from "@/lib/config";

const assurances = [
  { icon: Clock, label: siteConfig.deliveryNote },
  { icon: MapPin, label: "Delivery across Greater Accra" },
  { icon: ShieldCheck, label: "Real support, real people" },
];

export default async function HomePage() {
  const departments = await listDepartments();
  const roots = departments.filter((department) => department.parentId === null);
  const { items: arrivals } = await listProducts({ sort: "newest" });
  const counts = Object.fromEntries(
    await Promise.all(
      roots.map(async (department) => {
        const { total } = await listProducts({ departmentSlug: department.slug });
        return [department.id, total] as const;
      }),
    ),
  );

  return (
    <>
      <section className="shell grid gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)] lg:items-center lg:gap-16 lg:py-16">
        <div className="min-w-0">
          <p className="label-xs text-clay">Accra · Genuine imports</p>
          <h1 className="mt-3 text-[2rem] sm:text-[2.5rem] lg:text-[2.75rem]">
            Shop what you came for.
          </h1>
          <p className="mt-4 max-w-md text-[13px] leading-relaxed text-ink-muted">
            The UK and US goods most Accra shelves don&apos;t carry, stocked close to home.
          </p>
          <div className="mt-6 flex items-center gap-4">
            <Button asChild>
              <Link href="/shop">
                Shop all
                <ArrowRight size={14} strokeWidth={1.5} />
              </Link>
            </Button>
            <Button asChild variant="link">
              <Link href="/about">About Raj</Link>
            </Button>
          </div>
          <ul className="mt-9 flex flex-col gap-2 border-t border-line pt-5 sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-2">
            {assurances.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-1.5 text-ink-muted">
                <Icon size={14} strokeWidth={1.5} className="shrink-0 text-clay" />
                <span className="label-xs">{label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="relative col-span-2 aspect-4/5 overflow-hidden rounded-md border border-line">
            <Image
              src="/images/editorial/hero-main.jpg"
              alt="Raj Kollections goods"
              fill
              priority
              sizes="(min-width: 1024px) 32vw, 62vw"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col gap-3">
            <div className="relative aspect-square overflow-hidden rounded-md border border-line">
              <Image
                src="/images/editorial/hero-pantry.jpg"
                alt="Pantry goods"
                fill
                priority
                sizes="(min-width: 1024px) 16vw, 30vw"
                className="object-cover"
              />
            </div>
            <div className="relative flex-1 overflow-hidden rounded-md border border-line">
              <Image
                src="/images/editorial/hero-dress.jpg"
                alt="Fashion goods"
                fill
                sizes="(min-width: 1024px) 16vw, 30vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="shell py-6">
        <SectionHeading eyebrow="Departments" title="Shop by aisle" href="/shop" linkLabel="All products" />
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {roots.map((department) => (
            <DepartmentCard
              key={department.id}
              department={department}
              count={counts[department.id]}
            />
          ))}
        </div>
      </section>

      <section className="shell py-14">
        <SectionHeading
          eyebrow="Just in"
          title="New arrivals"
          href="/shop?sort=newest"
          linkLabel="See all"
        />
        <div className="mt-6">
          <ProductRail products={arrivals.slice(0, 8)} departments={departments} />
        </div>
      </section>
    </>
  );
}
