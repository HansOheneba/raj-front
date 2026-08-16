"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import type { Department, SortKey } from "@/lib/catalog";
import { cn } from "@/lib/utils";

const sorts: { value: SortKey; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "popularity", label: "Popular" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
];

export function ShopListing({
  departments,
  lockedDepartment,
  resultCount,
  children,
}: {
  departments: Department[];
  lockedDepartment?: string;
  resultCount: number;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const currentSort = (params.get("sort") as SortKey) || "featured";
  const inStockOnly = params.get("stock") === "1";
  const onSaleOnly = params.get("sale") === "1";
  const currentDepartment = lockedDepartment ?? params.get("department") ?? "";

  const push = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (!value) next.delete(key);
      else next.set(key, value);
    }
    const query = next.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const roots = departments.filter((department) => department.parentId === null);

  return (
    <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
      <aside className="hidden lg:block">
        <p className="label-xs text-ink-faint">Filter</p>
        {!lockedDepartment && (
          <nav className="mt-3 flex flex-col gap-1">
            <FilterLink href="/shop" label="All" active={!currentDepartment} />
            {roots.map((department) => (
              <FilterLink
                key={department.id}
                href={`/shop/${department.slug}`}
                label={department.name}
                active={currentDepartment === department.slug}
              />
            ))}
          </nav>
        )}
        <div className={cn("flex flex-col gap-2", !lockedDepartment && "mt-6")}>
          <FilterToggle
            active={inStockOnly}
            onClick={() => push({ stock: inStockOnly ? undefined : "1" })}
            label="In stock"
          />
          <FilterToggle
            active={onSaleOnly}
            onClick={() => push({ sale: onSaleOnly ? undefined : "1" })}
            label="On sale"
          />
        </div>
      </aside>

      <div>
        <div className="mb-6 flex flex-col gap-4 lg:hidden">
          {!lockedDepartment && (
            <div className="no-rail flex gap-2 overflow-x-auto">
              <FilterChip active={!currentDepartment} href="/shop" label="All" />
              {roots.map((department) => (
                <FilterChip
                  key={department.id}
                  active={currentDepartment === department.slug}
                  href={`/shop/${department.slug}`}
                  label={department.name}
                />
              ))}
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
            <p className="text-[13px] text-ink-muted">{resultCount} products</p>
            <div className="flex flex-wrap items-center gap-2">
              <FilterToggle
                active={inStockOnly}
                onClick={() => push({ stock: inStockOnly ? undefined : "1" })}
                label="In stock"
              />
              <FilterToggle
                active={onSaleOnly}
                onClick={() => push({ sale: onSaleOnly ? undefined : "1" })}
                label="On sale"
              />
              <SortSelect value={currentSort} onChange={(sort) => push({ sort })} />
            </div>
          </div>
        </div>

        <div className="mb-6 hidden items-center justify-between gap-3 border-b border-line pb-4 lg:flex">
          <p className="text-[13px] text-ink-muted">{resultCount} products</p>
          <SortSelect value={currentSort} onChange={(sort) => push({ sort })} />
        </div>

        {children}
      </div>
    </div>
  );
}

function SortSelect({
  value,
  onChange,
}: {
  value: SortKey;
  onChange: (value: string) => void;
}) {
  return (
    <select
      aria-label="Sort"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-8 rounded-md border border-input bg-cream px-2 text-[12px] outline-none"
    >
      {sorts.map((sort) => (
        <option key={sort.value} value={sort.value}>
          {sort.label}
        </option>
      ))}
    </select>
  );
}

function FilterToggle({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-8 rounded-md border px-2.5 text-left text-[11px] transition-[background-color,border-color,color] duration-[var(--duration-ui)] ease-[var(--ease-out)]",
        active
          ? "border-clay bg-clay-soft text-clay-dark"
          : "border-line-strong text-ink-muted",
      )}
    >
      {label}
    </button>
  );
}

function FilterChip({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "label-xs shrink-0 rounded-full border px-3 py-1.5 transition-[background-color,border-color,color] duration-[var(--duration-ui)] ease-[var(--ease-out)]",
        active ? "border-ink bg-ink text-cream" : "border-line text-ink-muted hover:border-ink/40",
      )}
    >
      {label}
    </Link>
  );
}

function FilterLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-md px-2 py-1.5 text-[13px] transition-colors duration-[var(--duration-ui)] ease-[var(--ease-out)]",
        active ? "bg-sand font-medium text-ink" : "text-ink-muted hover:text-ink",
      )}
    >
      {label}
    </Link>
  );
}
