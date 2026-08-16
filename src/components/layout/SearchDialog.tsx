"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { PriceTag } from "@/components/ui/PriceTag";
import { mockCatalog } from "@/lib/catalog/mock";
import type { Department, Product } from "@/lib/catalog";

export function SearchDialog({
  open,
  onClose,
  departments,
}: {
  open: boolean;
  onClose: () => void;
  departments: Department[];
}) {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 40);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) setTerm("");
  }, [open]);

  useEffect(() => {
    if (term.trim().length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    void mockCatalog.searchProducts(term, 6).then((items) => {
      if (!cancelled) setResults(items);
    });
    return () => {
      cancelled = true;
    };
  }, [term]);

  if (!open) return null;

  const submit = () => {
    const trimmed = term.trim();
    if (!trimmed) return;
    onClose();
    router.push(`/shop?q=${encodeURIComponent(trimmed)}`);
  };

  const departmentName = (product: Product) =>
    departments.find((department) => department.id === product.departmentId)?.name;

  return (
    <div className="fixed inset-0 z-[60] animate-fade-in">
      <button
        type="button"
        aria-label="Close search"
        onClick={onClose}
        className="absolute inset-0 bg-ink/20 backdrop-blur-[2px]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search products"
        className="relative mx-auto mt-[12vh] w-[calc(100%-2rem)] max-w-lg origin-top animate-pop-in overflow-hidden rounded-lg border border-line bg-cream shadow-lift"
      >
        <div className="flex items-center gap-2.5 border-b border-line px-3.5">
          <Search size={15} strokeWidth={1.5} className="shrink-0 text-ink-faint" />
          <input
            ref={inputRef}
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && submit()}
            placeholder="Search products"
            className="h-11 w-full bg-transparent text-[13px] text-ink placeholder:text-ink-faint focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="shrink-0 text-ink-faint transition-colors duration-[var(--duration-ui)] ease-[var(--ease-out)] hover:text-ink"
          >
            <X size={15} strokeWidth={1.5} />
          </button>
        </div>

        {term.trim().length > 1 && (
          <div className="max-h-[52vh] overflow-y-auto">
            {results.length === 0 ? (
              <p className="px-3.5 py-6 text-center text-[13px] text-ink-muted">
                Nothing matches “{term.trim()}”.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {results.map((product) => (
                  <li key={product.id}>
                    <Link
                      href={`/product/${product.slug}`}
                      onClick={onClose}
                      className="flex items-center gap-3 px-3.5 py-2.5 transition-colors duration-[var(--duration-ui)] ease-[var(--ease-out)] hover:bg-sand"
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
            <button
              type="button"
              onClick={submit}
              className="label-sm w-full border-t border-line px-3.5 py-2.5 text-center text-ink-muted transition-colors duration-[var(--duration-ui)] ease-[var(--ease-out)] hover:bg-sand hover:text-clay"
            >
              See all results
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
