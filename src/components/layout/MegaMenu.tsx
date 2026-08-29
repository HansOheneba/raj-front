"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { PriceTag } from "@/components/ui/PriceTag";
import { cn } from "@/lib/utils";
import type { MegaMenuItem, MegaMenuProduct } from "@/lib/catalog";

const OPEN_DELAY = 160;
const SWITCH_DELAY = 140;
const CLOSE_DELAY = 380;
const CONTENT_FADE_MS = 150;
const MAX_PRODUCTS = 7;

export function MegaMenu({
  items,
  sale,
  newest,
}: {
  items: MegaMenuItem[];
  sale: MegaMenuItem;
  newest: MegaMenuItem;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const onSale = searchParams.get("sale") === "1";
  const newestSort = searchParams.get("sort") === "newest";
  const panelId = useId();
  const [activeId, setActiveId] = useState<string | null>(null);
  const openTimer = useRef<number>(0);
  const closeTimer = useRef<number>(0);
  const switchTimer = useRef<number>(0);
  const activeIdRef = useRef<string | null>(null);

  activeIdRef.current = activeId;

  const clearTimers = () => {
    window.clearTimeout(openTimer.current);
    window.clearTimeout(closeTimer.current);
    window.clearTimeout(switchTimer.current);
  };

  const keepOpen = () => {
    window.clearTimeout(closeTimer.current);
    window.clearTimeout(openTimer.current);
  };

  const open = (id: string) => {
    keepOpen();
    window.clearTimeout(switchTimer.current);

    if (activeIdRef.current === id) return;

    if (activeIdRef.current) {
      switchTimer.current = window.setTimeout(() => setActiveId(id), SWITCH_DELAY);
      return;
    }

    openTimer.current = window.setTimeout(() => setActiveId(id), OPEN_DELAY);
  };

  const scheduleClose = () => {
    window.clearTimeout(openTimer.current);
    window.clearTimeout(switchTimer.current);
    closeTimer.current = window.setTimeout(() => setActiveId(null), CLOSE_DELAY);
  };

  useEffect(() => {
    setActiveId(null);
  }, [pathname]);

  useEffect(() => clearTimers, []);

  useEffect(() => {
    if (!activeId) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveId(null);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [activeId]);

  const active =
    activeId === sale.id
      ? sale
      : activeId === newest.id
        ? newest
        : (items.find((item) => item.id === activeId) ?? null);

  return (
    <div
      className="relative hidden lg:block"
      onMouseLeave={scheduleClose}
      onMouseEnter={keepOpen}
    >
      <nav
        className="shell flex h-11 items-center justify-center gap-0.5 overflow-x-auto no-rail"
        aria-label="Shop categories"
      >
        <CategoryLink href="/shop" active={pathname === "/shop"}>
          Shop all
        </CategoryLink>
        <MenuTrigger
          item={sale}
          isOpen={activeId === sale.id}
          isActive={pathname.startsWith("/shop") && onSale}
          panelId={panelId}
          onOpen={open}
          onClose={() => setActiveId(null)}
        />
        <MenuTrigger
          item={newest}
          isOpen={activeId === newest.id}
          isActive={pathname.startsWith("/shop") && newestSort}
          panelId={panelId}
          onOpen={open}
          onClose={() => setActiveId(null)}
        />
        {items.map((item) => {
          const isOpen = activeId === item.id;
          const isActive =
            pathname === item.href || item.children.some((child) => pathname === child.href);
          return (
            <MenuTrigger
              key={item.id}
              item={item}
              isOpen={isOpen}
              isActive={isActive}
              panelId={panelId}
              onOpen={open}
              onClose={() => setActiveId(null)}
            />
          );
        })}
      </nav>

      {active && (
        <>
          <div
            id={panelId}
            role="region"
            aria-label={active.name}
            className="absolute inset-x-0 top-full z-50 pt-2 motion-safe:animate-mega-in"
            onMouseEnter={keepOpen}
          >
            <div className="border-b border-line bg-cream shadow-lift">
              <AnimatedMegaPanel item={active} />
            </div>
          </div>
          <button
            type="button"
            tabIndex={-1}
            aria-label="Close menu"
            onClick={() => setActiveId(null)}
            className="pointer-events-none absolute inset-x-0 top-full z-40 h-dvh"
          />
        </>
      )}
    </div>
  );
}

function AnimatedMegaPanel({ item }: { item: MegaMenuItem }) {
  const [rendered, setRendered] = useState(item);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (item.id === rendered.id) return;

    setVisible(false);
    const timer = window.setTimeout(() => {
      setRendered(item);
      setVisible(true);
    }, CONTENT_FADE_MS);

    return () => window.clearTimeout(timer);
  }, [item, rendered.id]);

  return (
    <div
      className={cn(
        "transition-[opacity,transform] duration-[var(--duration-ui)] ease-[var(--ease-out)] motion-reduce:transition-none",
        visible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
      )}
    >
      <MegaPanel item={rendered} />
    </div>
  );
}

function MenuTrigger({
  item,
  isOpen,
  isActive,
  panelId,
  onOpen,
  onClose,
}: {
  item: MegaMenuItem;
  isOpen: boolean;
  isActive: boolean;
  panelId: string;
  onOpen: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <Link
      href={item.href}
      className={cn(
        "shrink-0 px-3 text-[13px] font-medium transition-colors duration-[var(--duration-ui)] ease-[var(--ease-out)]",
        isOpen || isActive ? "text-clay" : "text-ink-muted hover:text-ink",
      )}
      aria-expanded={isOpen}
      aria-haspopup="true"
      aria-controls={panelId}
      onMouseEnter={() => onOpen(item.id)}
      onFocus={() => onOpen(item.id)}
      onClick={onClose}
    >
      {item.name}
    </Link>
  );
}

function CategoryLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "shrink-0 px-3 text-[13px] font-medium transition-colors duration-[var(--duration-ui)] ease-[var(--ease-out)]",
        active ? "text-clay" : "text-ink-muted hover:text-ink",
      )}
    >
      {children}
    </Link>
  );
}

function MegaPanel({ item }: { item: MegaMenuItem }) {
  const subcategories =
    item.children.length > 0
      ? item.children
      : [
          {
            ...item,
            children: [],
            featured: item.featured,
          },
        ];
  const [activeChildId, setActiveChildId] = useState(subcategories[0]?.id ?? null);
  const [pendingChildId, setPendingChildId] = useState<string | null>(null);
  const childTimer = useRef<number>(0);
  const activeChild = subcategories.find((child) => child.id === activeChildId);
  const products = (
    activeChild && activeChild.featured.length > 0 ? activeChild.featured : item.featured
  ).slice(0, MAX_PRODUCTS);

  useEffect(() => {
    setActiveChildId(subcategories[0]?.id ?? null);
    setPendingChildId(null);
  }, [item.id]);

  useEffect(() => () => window.clearTimeout(childTimer.current), []);

  const previewChild = (childId: string) => {
    window.clearTimeout(childTimer.current);
    if (activeChildId === childId) return;
    setPendingChildId(childId);
    childTimer.current = window.setTimeout(() => {
      setActiveChildId(childId);
      setPendingChildId(null);
    }, SWITCH_DELAY);
  };

  return (
    <div className="shell py-5">
      <div className="flex gap-8">
        <aside className="w-[12.5rem] shrink-0 border-r border-line pr-6">
          <p className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">
            {item.name}
          </p>
          <ul className="mt-3 space-y-0.5" role="list">
            {subcategories.map((child) => (
              <SubcategoryNavItem
                key={child.id}
                item={child}
                active={activeChildId === child.id || pendingChildId === child.id}
                onHover={() => previewChild(child.id)}
                onSelect={() => setActiveChildId(child.id)}
              />
            ))}
          </ul>
          <Link
            href={item.href}
            className="mt-5 inline-flex items-center gap-1 text-[12px] text-ink-muted transition-colors duration-[var(--duration-ui)] ease-[var(--ease-out)] hover:text-clay"
          >
            View all {item.name.toLowerCase()}
            <span aria-hidden>→</span>
          </Link>
        </aside>

        <div className="min-w-0 flex-1">
          {activeChild && (
            <div className="flex items-baseline justify-between gap-4">
              <Link
                href={activeChild.href}
                className="text-[13px] font-medium text-ink transition-colors duration-[var(--duration-ui)] ease-[var(--ease-out)] hover:text-clay"
              >
                View all {activeChild.name.toLowerCase()}
                <span className="text-ink-muted"> →</span>
              </Link>
            </div>
          )}

          {products.length > 0 ? (
            <AnimatedProductGrid
              key={`${item.id}-${activeChildId}`}
              products={products}
            />
          ) : activeChild ? (
            <SubcategoryEmptyState item={activeChild} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SubcategoryNavItem({
  item,
  active,
  onHover,
  onSelect,
}: {
  item: MegaMenuItem;
  active: boolean;
  onHover: () => void;
  onSelect: () => void;
}) {
  return (
    <li>
      <Link
        href={item.href}
        onMouseEnter={onHover}
        onFocus={onHover}
        onClick={onSelect}
        className={cn(
          "flex items-center gap-2.5 rounded-md px-2 py-2 text-[13px] transition-colors duration-[var(--duration-ui)] ease-[var(--ease-out)]",
          active
            ? "bg-sand font-medium text-ink"
            : "text-ink-muted hover:bg-ivory hover:text-ink",
        )}
      >
        <span className="relative size-7 shrink-0 overflow-hidden rounded-md border border-line bg-ivory">
          <Image
            src={item.image}
            alt=""
            fill
            sizes="28px"
            className="object-cover"
          />
        </span>
        <span className="min-w-0 truncate">{item.name}</span>
      </Link>
    </li>
  );
}

function SubcategoryEmptyState({ item }: { item: MegaMenuItem }) {
  return (
    <div className="mt-5 flex gap-6">
      <div className="relative size-36 shrink-0 overflow-hidden rounded-lg border border-line bg-ivory">
        <Image
          src={item.image}
          alt=""
          fill
          sizes="144px"
          className="object-cover"
        />
      </div>
      <div className="flex min-w-0 flex-col justify-center">
        <p className="max-w-sm text-[13px] leading-relaxed text-ink-muted">
          {item.description}
        </p>
        <Link
          href={item.href}
          className="mt-4 inline-flex w-fit items-center rounded-md bg-ink px-4 py-2 text-[13px] font-medium text-cream transition-opacity duration-[var(--duration-ui)] ease-[var(--ease-out)] hover:opacity-90"
        >
          Shop {item.name.toLowerCase()}
        </Link>
      </div>
    </div>
  );
}

function AnimatedProductGrid({ products }: { products: MegaMenuProduct[] }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
    const frame = window.requestAnimationFrame(() => setVisible(true));
    return () => window.cancelAnimationFrame(frame);
  }, [products]);

  return (
    <div
      className={cn(
        "mt-4 flex flex-wrap gap-4 transition-[opacity,transform] duration-[var(--duration-ui)] ease-[var(--ease-out)] motion-reduce:transition-none",
        visible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
      )}
    >
      {products.map((product) => (
        <ProductTile key={product.id} product={product} />
      ))}
    </div>
  );
}

function ProductTile({ product }: { product: MegaMenuProduct }) {
  return (
    <Link
      href={`/product/${product.slug}`}
      className="group flex w-[8.5rem] flex-col"
    >
      <span className="relative aspect-square w-full overflow-hidden rounded-md border border-line bg-ivory">
        <Image
          src={product.image}
          alt=""
          fill
          sizes="120px"
          className="object-cover hover-zoom"
        />
      </span>
      <span className="mt-2 line-clamp-2 text-[11px] font-medium leading-snug text-ink group-hover:text-clay">
        {product.name}
      </span>
      <span className="mt-1">
        <PriceTag price={product.price} compareAtPrice={product.compareAtPrice} size="sm" />
      </span>
    </Link>
  );
}
