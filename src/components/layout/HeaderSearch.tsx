"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PriceTag } from "@/components/ui/PriceTag";
import { matchDepartments, searchProducts, type Department, type Product } from "@/lib/catalog";
import { cn } from "@/lib/utils";

const DEBOUNCE_MS = 150;

export function HeaderSearch({ departments }: { departments: Department[] }) {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [aisles, setAisles] = useState<Department[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const trimmed = term.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setAisles([]);
      setSearching(false);
      return;
    }

    let cancelled = false;
    setSearching(true);
    const timer = window.setTimeout(() => {
      void searchProducts(trimmed, 6)
        .then((items) => {
          if (cancelled) return;
          setResults(items);
          setAisles(matchDepartments(departments, trimmed, 4));
        })
        .catch(() => {
          if (cancelled) return;
          setResults([]);
          setAisles([]);
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [term, departments]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const submit = () => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setOpen(false);
    router.push(`/shop?q=${encodeURIComponent(trimmed)}`);
  };

  const departmentName = (product: Product) =>
    departments.find((department) => department.id === product.departmentId)?.name;

  const showResults = open && term.trim().length > 1;

  return (
    <div ref={rootRef} className="relative mx-auto w-full max-w-2xl">
      <Search
        size={16}
        strokeWidth={1.5}
        className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-ink-faint"
      />
      <Input
        value={term}
        onChange={(event) => {
          setTerm(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter") submit();
          if (event.key === "Escape") setOpen(false);
        }}
        placeholder="Search products"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        aria-expanded={showResults}
        aria-controls="header-search-results"
        id="header-search"
        className="h-10 rounded-full border-line-strong bg-sand/60 pl-10 pr-4"
      />

      {showResults && (
        <div
          id="header-search-results"
          className="absolute inset-x-0 top-[calc(100%+0.375rem)] z-[60] overflow-hidden rounded-lg border border-line bg-cream shadow-lift"
        >
          <div className="max-h-[min(24rem,50vh)] overflow-y-auto">
            {searching && results.length === 0 && aisles.length === 0 ? (
              <p className="px-4 py-5 text-center text-[13px] text-ink-muted">Searching…</p>
            ) : results.length === 0 && aisles.length === 0 ? (
              <p className="px-4 py-5 text-center text-[13px] text-ink-muted">
                Nothing matches “{term.trim()}”.
              </p>
            ) : (
              <>
                {aisles.length > 0 && (
                  <div className="border-b border-line px-4 py-3">
                    <p className="label-xs pb-2 text-ink-faint">Aisles</p>
                    <ul className="flex flex-wrap gap-1.5">
                      {aisles.map((department) => (
                        <li key={department.id}>
                          <Link
                            href={`/shop/${department.slug}`}
                            onClick={() => setOpen(false)}
                            className="inline-flex rounded-md border border-line bg-ivory px-2.5 py-1 text-[12px] text-ink-muted transition-colors duration-[var(--duration-ui)] ease-[var(--ease-out)] hover:border-clay hover:text-clay"
                          >
                            {department.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {results.length > 0 && (
                  <ul className="divide-y divide-line">
                    {results.map((product) => (
                      <li key={product.id}>
                        <Link
                          href={`/product/${product.slug}`}
                          onClick={() => setOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 transition-colors duration-[var(--duration-ui)] ease-[var(--ease-out)] hover:bg-sand"
                        >
                          <span className="relative h-11 w-9 shrink-0 overflow-hidden rounded-md border border-line">
                            <Image
                              src={product.imageUrls[0]}
                              alt=""
                              fill
                              sizes="36px"
                              className="object-cover"
                            />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] text-ink">{product.name}</span>
                            <span className="label-xs block pt-1 text-ink-faint">
                              {departmentName(product)}
                            </span>
                          </span>
                          <PriceTag price={product.price} compareAtPrice={product.compareAtPrice} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
          <button
            type="button"
            onClick={submit}
            className="label-sm w-full border-t border-line px-4 py-2.5 text-center text-ink-muted transition-colors duration-[var(--duration-ui)] ease-[var(--ease-out)] hover:bg-sand hover:text-clay"
          >
            See all results
          </button>
        </div>
      )}
    </div>
  );
}

export function HeaderSearchMobileTrigger({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Search"
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-md text-ink-muted transition-colors duration-[var(--duration-ui)] ease-[var(--ease-out)] hover:bg-sand hover:text-ink",
        className,
      )}
    >
      <Search size={17} strokeWidth={1.5} />
    </button>
  );
}
