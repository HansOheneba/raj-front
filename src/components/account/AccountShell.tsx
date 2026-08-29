"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, LogOut, MapPin, MessageCircle, Package } from "lucide-react";
import { AuthForm } from "@/components/customer/AuthForm";
import { useCustomer } from "@/components/customer/CustomerProvider";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Skeleton } from "@/components/ui/skeleton";
import { formatGhanaPhone } from "@/lib/phone";
import { cn } from "@/lib/utils";

const mainLinks = [
  { href: "/account", label: "My orders", icon: Package, exact: true },
  { href: "/account/addresses", label: "Your addresses", icon: MapPin, exact: false },
  { href: "/account/saved", label: "Saved items", icon: Heart, exact: false },
] as const;

function isActive(pathname: string, href: string, exact: boolean) {
  if (href === "/account") {
    return pathname === "/account" || pathname.startsWith("/account/orders");
  }
  return exact ? pathname === href : pathname.startsWith(href);
}

function crumbsFor(pathname: string) {
  if (pathname.startsWith("/account/addresses")) {
    return [
      { label: "Home", href: "/" },
      { label: "Account", href: "/account" },
      { label: "Your addresses" },
    ];
  }
  if (pathname.startsWith("/account/saved")) {
    return [
      { label: "Home", href: "/" },
      { label: "Account", href: "/account" },
      { label: "Saved items" },
    ];
  }
  if (pathname.startsWith("/account/orders/")) {
    return [
      { label: "Home", href: "/" },
      { label: "Account", href: "/account" },
      { label: "Order" },
    ];
  }
  return [{ label: "Home", href: "/" }, { label: "Account" }];
}

function authReasonFor(pathname: string) {
  return pathname.startsWith("/account/orders/") ? "order" : "account";
}

export function AccountShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { ready, customer, signOut } = useCustomer();

  if (!ready) {
    return (
      <div className="shell py-8">
        <Skeleton className="h-3 w-28" />
        <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr] lg:gap-12">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="shell py-8">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Account" }]} />
        <div className="mx-auto mt-8 max-w-md">
          <AuthForm reason={authReasonFor(pathname)} />
        </div>
      </div>
    );
  }

  return (
    <div className="shell py-8">
      <Breadcrumbs items={crumbsFor(pathname)} />
      <div className="mt-6 grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start lg:gap-12">
        <aside className="lg:sticky lg:top-20">
          <p className="text-xl">Your account</p>
          <p className="mt-1.5 text-[13px] font-medium text-ink">{customer.name}</p>
          <p className="text-[12px] text-ink-muted">{formatGhanaPhone(customer.phone)}</p>

          <nav
            aria-label="Account"
            className="rail mt-5 -mx-1 flex gap-1 overflow-x-auto pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:pb-0"
          >
            {mainLinks.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item.href, item.exact);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-2 rounded-md px-2.5 py-2 text-[13px] transition-colors duration-[var(--duration-ui)] ease-[var(--ease-out)]",
                    active
                      ? "bg-clay-soft text-clay-dark"
                      : "text-ink-muted hover:bg-sand hover:text-ink",
                  )}
                >
                  <Icon size={15} strokeWidth={1.5} />
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/contact"
              className="inline-flex shrink-0 items-center gap-2 rounded-md px-2.5 py-2 text-[13px] text-ink-muted transition-colors duration-[var(--duration-ui)] ease-[var(--ease-out)] hover:bg-sand hover:text-ink lg:mt-6"
            >
              <MessageCircle size={15} strokeWidth={1.5} />
              Customer support
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="inline-flex shrink-0 items-center gap-2 rounded-md px-2.5 py-2 text-left text-[13px] text-ink-muted transition-colors duration-[var(--duration-ui)] ease-[var(--ease-out)] hover:bg-sand hover:text-ink"
            >
              <LogOut size={15} strokeWidth={1.5} />
              Log out
            </button>
          </nav>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
