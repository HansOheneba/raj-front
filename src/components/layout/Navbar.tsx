"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, Menu, ShoppingBag, User } from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { HeaderSearch, HeaderSearchMobileTrigger } from "./HeaderSearch";
import { MegaMenu } from "./MegaMenu";
import { SearchDialog } from "./SearchDialog";
import { useMobileNav } from "./mobile-nav";
import { useCart } from "@/components/cart/CartProvider";
import { useCustomer } from "@/components/customer/CustomerProvider";
import { useSaved } from "@/components/saved/SavedProvider";
import { siteConfig } from "@/lib/config";
import { cn, formatPrice } from "@/lib/utils";
import type { Department, MegaMenuData } from "@/lib/catalog";

export function Navbar({
  departments,
  megaMenu,
}: {
  departments: Department[];
  megaMenu: MegaMenuData;
}) {
  const { count, ready, addedSignal } = useCart();
  const { customer } = useCustomer();
  const { count: savedCount, ready: savedReady } = useSaved();
  const { open: menuOpen, setOpen: setMenuOpen } = useMobileNav();
  const [searchOpen, setSearchOpen] = useState(false);
  const [bump, setBump] = useState(false);

  useEffect(() => {
    if (addedSignal === 0) return;
    setBump(true);
    const timer = window.setTimeout(() => setBump(false), 180);
    return () => window.clearTimeout(timer);
  }, [addedSignal]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "k") return;
      event.preventDefault();
      if (window.matchMedia("(min-width: 1024px)").matches) {
        document.getElementById("header-search")?.focus();
      } else {
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

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

      <header className="sticky top-0 z-50 bg-ivory/90 backdrop-blur-md">
        <div className="relative border-b border-line">
          <div className="shell grid h-14 grid-cols-[1fr_auto] items-center gap-3 lg:h-[3.75rem] lg:grid-cols-[minmax(0,1fr)_minmax(0,36rem)_minmax(0,1fr)] lg:gap-6">
            <BrandLogo className="h-9 shrink-0 justify-self-start" size={36} priority />

            <div className="hidden w-full min-w-0 justify-self-center lg:block">
              <HeaderSearch departments={departments} />
            </div>

            <div className="flex items-center justify-self-end gap-1 lg:gap-2">
              <HeaderSearchMobileTrigger
                onClick={() => setSearchOpen(true)}
                className="lg:hidden"
              />

              <Link
                href="/contact"
                className="hidden text-[12px] text-ink-muted transition-colors duration-[var(--duration-ui)] ease-[var(--ease-out)] hover:text-clay lg:inline-flex"
              >
                Need help?
              </Link>

              <Link
                href="/saved"
                aria-label={
                  customer
                    ? `Your list, ${savedCount} ${savedCount === 1 ? "item" : "items"}`
                    : "Your list"
                }
                className="relative flex h-9 w-9 items-center justify-center rounded-md text-ink-muted transition-colors duration-[var(--duration-ui)] ease-[var(--ease-out)] hover:bg-sand hover:text-ink"
              >
                <Heart size={17} strokeWidth={1.5} />
                {savedReady && customer && savedCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-clay px-1 text-[9px] font-medium tabular-nums text-cream">
                    {savedCount > 99 ? "99+" : savedCount}
                  </span>
                )}
              </Link>

              <Link
                href="/account"
                aria-label={customer ? "Account" : "Sign in"}
                className="hidden h-9 w-9 items-center justify-center rounded-md text-ink-muted transition-colors duration-[var(--duration-ui)] ease-[var(--ease-out)] hover:bg-sand hover:text-ink lg:flex"
              >
                <User size={17} strokeWidth={1.5} />
              </Link>

              <Link
                href="/cart"
                aria-label={`Cart, ${count} ${count === 1 ? "item" : "items"}`}
                className="relative flex h-9 w-9 items-center justify-center rounded-md text-ink-muted transition-colors duration-[var(--duration-ui)] ease-[var(--ease-out)] hover:bg-sand hover:text-ink"
              >
                <ShoppingBag
                  size={17}
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
                className="-mr-1 flex h-9 w-9 items-center justify-center rounded-md text-ink-muted transition-colors duration-[var(--duration-ui)] ease-[var(--ease-out)] hover:bg-sand hover:text-ink lg:hidden"
              >
                <Menu size={18} strokeWidth={1.5} />
              </button>
            </div>
          </div>

          <MegaMenu
            items={megaMenu.departments}
            sale={megaMenu.sale}
            newest={megaMenu.newest}
          />
        </div>
      </header>

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} departments={departments} />
    </>
  );
}
