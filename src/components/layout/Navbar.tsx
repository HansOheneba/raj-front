"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { SearchDialog } from "./SearchDialog";
import { useCart } from "@/components/cart/CartProvider";
import { siteConfig } from "@/lib/config";
import { cn, formatPrice } from "@/lib/utils";
import type { Department } from "@/lib/catalog";

export function Navbar({ departments }: { departments: Department[] }) {
  const pathname = usePathname();
  const { count, ready, addedSignal } = useCart();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [bump, setBump] = useState(false);
  const roots = departments.filter((department) => department.parentId === null);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (addedSignal === 0) return;
    setBump(true);
    const timer = window.setTimeout(() => setBump(false), 180);
    return () => window.clearTimeout(timer);
  }, [addedSignal]);

  const isActive = (href: string) =>
    href === "/shop" ? pathname.startsWith("/shop") : pathname === href;

  return (
    <>
      <div className="bg-ink text-cream">
        <div className="shell flex h-7 items-center justify-center">
          <p className="label-xs text-center text-cream/85">
            {siteConfig.deliveryNote} Free Accra delivery over{" "}
            <span className="text-cream">{formatPrice(siteConfig.freeShippingThreshold)}</span>
          </p>
        </div>
      </div>

      <header className="sticky top-0 z-50 border-b border-line bg-ivory/85 backdrop-blur-md">
        <div className="shell flex h-14 items-center justify-between gap-4">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              className="-ml-2 flex h-8 w-8 items-center justify-center rounded-md text-ink-muted transition-colors duration-[var(--duration-ui)] ease-[var(--ease-out)] hover:bg-sand hover:text-ink md:hidden"
            >
              {menuOpen ? <X size={17} strokeWidth={1.5} /> : <Menu size={17} strokeWidth={1.5} />}
            </button>

            <BrandLogo className="h-9" size={36} priority />
          </div>

          <nav className="hidden items-center gap-1 md:flex">
            <Link
              href="/shop"
              className={cn(
                "label-sm rounded-md px-2.5 py-2 transition-colors duration-[var(--duration-ui)] ease-[var(--ease-out)] hover:text-clay",
                isActive("/shop") ? "text-clay" : "text-ink-muted",
              )}
            >
              Shop
            </Link>
            {roots.slice(0, 4).map((department) => (
              <Link
                key={department.id}
                href={`/shop/${department.slug}`}
                className={cn(
                  "label-sm rounded-md px-2.5 py-2 transition-colors duration-[var(--duration-ui)] ease-[var(--ease-out)] hover:text-clay",
                  pathname === `/shop/${department.slug}` ? "text-clay" : "text-ink-muted",
                )}
              >
                {department.name}
              </Link>
            ))}
            <Link
              href="/contact"
              className={cn(
                "label-sm rounded-md px-2.5 py-2 transition-colors duration-[var(--duration-ui)] ease-[var(--ease-out)] hover:text-clay",
                isActive("/contact") ? "text-clay" : "text-ink-muted",
              )}
            >
              Support
            </Link>
          </nav>

          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className="flex h-8 w-8 items-center justify-center rounded-md text-ink-muted transition-colors duration-[var(--duration-ui)] ease-[var(--ease-out)] hover:bg-sand hover:text-ink"
            >
              <Search size={16} strokeWidth={1.5} />
            </button>

            <Link
              href="/cart"
              aria-label={`Cart, ${count} ${count === 1 ? "item" : "items"}`}
              className="relative flex h-8 w-8 items-center justify-center rounded-md text-ink-muted transition-colors duration-[var(--duration-ui)] ease-[var(--ease-out)] hover:bg-sand hover:text-ink"
            >
              <ShoppingBag
                size={16}
                strokeWidth={1.5}
                className={cn(
                  "transition-transform duration-[var(--duration-press)] ease-[var(--ease-out)]",
                  bump && "scale-110",
                )}
              />
              {ready && count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-clay px-1 text-[9px] font-medium tabular-nums text-cream">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </Link>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-line bg-cream md:hidden">
            <nav className="shell flex flex-col py-2">
              <Link href="/shop" className="label-sm py-2.5 text-ink">
                All products
              </Link>
              <div className="grid grid-cols-2 gap-x-4 border-y border-line py-1">
                {roots.map((department) => (
                  <Link
                    key={department.id}
                    href={`/shop/${department.slug}`}
                    className="py-1.5 text-[13px] text-ink-muted"
                  >
                    {department.name}
                  </Link>
                ))}
              </div>
              <Link href="/about" className="label-sm py-2.5 text-ink-muted">
                About
              </Link>
              <Link href="/contact" className="label-sm py-2.5 text-ink-muted">
                Support
              </Link>
            </nav>
          </div>
        )}
      </header>

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} departments={departments} />
    </>
  );
}
