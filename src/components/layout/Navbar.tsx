"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Heart, Menu, Search, ShoppingBag, User } from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { SearchDialog } from "./SearchDialog";
import { useMobileNav } from "./mobile-nav";
import { useCart } from "@/components/cart/CartProvider";
import { useCustomer } from "@/components/customer/CustomerProvider";
import { useSaved } from "@/components/saved/SavedProvider";
import { siteConfig } from "@/lib/config";
import { cn, formatPrice } from "@/lib/utils";
import type { Department } from "@/lib/catalog";

export function Navbar({ departments }: { departments: Department[] }) {
  const pathname = usePathname();
  const { count, ready, addedSignal } = useCart();
  const { customer } = useCustomer();
  const { count: savedCount, ready: savedReady } = useSaved();
  const { open: menuOpen, setOpen: setMenuOpen } = useMobileNav();
  const [searchOpen, setSearchOpen] = useState(false);
  const [bump, setBump] = useState(false);
  const roots = departments.filter((department) => department.parentId === null);

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
            Free Accra delivery over{" "}
            <span className="text-cream">{formatPrice(siteConfig.freeShippingThreshold)}</span>
          </p>
        </div>
      </div>

      <header className="sticky top-0 z-50 border-b border-line bg-ivory/85 backdrop-blur-md">
        <div className="shell flex h-14 items-center justify-between gap-4">
          <BrandLogo className="h-9" size={36} priority />

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
              href="/saved"
              aria-label={
                customer
                  ? `Your list, ${savedCount} ${savedCount === 1 ? "item" : "items"}`
                  : "Your list"
              }
              className="relative flex h-8 w-8 items-center justify-center rounded-md text-ink-muted transition-colors duration-[var(--duration-ui)] ease-[var(--ease-out)] hover:bg-sand hover:text-ink"
            >
              <Heart size={16} strokeWidth={1.5} />
              {savedReady && customer && savedCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-clay px-1 text-[9px] font-medium tabular-nums text-cream">
                  {savedCount > 99 ? "99+" : savedCount}
                </span>
              )}
            </Link>

            <Link
              href="/account"
              aria-label={customer ? "Account" : "Sign in"}
              className="hidden h-8 w-8 items-center justify-center rounded-md text-ink-muted transition-colors duration-[var(--duration-ui)] ease-[var(--ease-out)] hover:bg-sand hover:text-ink md:flex"
            >
              <User size={16} strokeWidth={1.5} />
            </Link>

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

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              className="-mr-2 flex h-8 w-8 items-center justify-center rounded-md text-ink-muted transition-colors duration-[var(--duration-ui)] ease-[var(--ease-out)] hover:bg-sand hover:text-ink md:hidden"
            >
              <Menu size={17} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </header>

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} departments={departments} />
    </>
  );
}
