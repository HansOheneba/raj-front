"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, LogOut, MapPin, MessageCircle, MoreVertical, Package, User } from "lucide-react";
import { AuthForm } from "@/components/customer/AuthForm";
import { useCustomer } from "@/components/customer/CustomerProvider";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { formatGhanaPhone } from "@/lib/phone";
import { cn } from "@/lib/utils";

const mainLinks = [
  { href: "/account", label: "My orders", icon: Package, exact: true },
  { href: "/account/profile", label: "Your details", icon: User, exact: false },
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
  if (pathname.startsWith("/account/profile")) {
    return [
      { label: "Home", href: "/" },
      { label: "Account", href: "/account" },
      { label: "Your details" },
    ];
  }
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

function AccountOverflowMenu({ onSignOut }: { onSignOut: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0"
          aria-label="Account options"
        >
          <MoreVertical size={16} strokeWidth={1.5} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-48 p-1">
        <Button
          asChild
          variant="ghost"
          className="w-full justify-start px-2.5 text-[13px]"
          onClick={() => setOpen(false)}
        >
          <Link href="/contact">
            <MessageCircle size={15} strokeWidth={1.5} />
            Customer support
          </Link>
        </Button>
        <Separator className="my-1" />
        <Button
          type="button"
          variant="ghost"
          className="w-full justify-start px-2.5 text-[13px] text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => {
            setOpen(false);
            onSignOut();
          }}
        >
          <LogOut size={15} strokeWidth={1.5} />
          Log out
        </Button>
      </PopoverContent>
    </Popover>
  );
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
    <div className="shell py-5 sm:py-8">
      <Breadcrumbs items={crumbsFor(pathname)} />
      <div className="mt-5 grid min-w-0 gap-7 sm:mt-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start lg:gap-12">
        <aside className="min-w-0 lg:sticky lg:top-20">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xl">Your account</p>
              <p className="mt-1.5 truncate text-[13px] font-medium text-ink">{customer.name}</p>
              <p className="truncate text-[12px] text-ink-muted">{formatGhanaPhone(customer.phone)}</p>
            </div>
            <div className="lg:hidden">
              <AccountOverflowMenu onSignOut={signOut} />
            </div>
          </div>

          <nav aria-label="Account" className="mt-5 min-w-0">
            <div className="grid grid-cols-2 gap-1 lg:grid-cols-1">
              {mainLinks.map((item) => {
                const Icon = item.icon;
                const active = isActive(pathname, item.href, item.exact);
                return (
                  <Button
                    key={item.href}
                    asChild
                    variant="ghost"
                    className={cn(
                      "w-full justify-start px-2.5 text-[13px]",
                      active && "bg-clay-soft text-clay-dark hover:bg-clay-soft hover:text-clay-dark",
                    )}
                  >
                    <Link href={item.href} aria-current={active ? "page" : undefined}>
                      <Icon size={15} strokeWidth={1.5} />
                      {item.label}
                    </Link>
                  </Button>
                );
              })}
            </div>
            <div className="mt-3 hidden grid-cols-1 gap-1 border-t border-line pt-3 lg:mt-6 lg:grid">
              <Button asChild variant="ghost" className="w-full justify-start px-2.5 text-[13px]">
                <Link href="/contact">
                  <MessageCircle size={15} strokeWidth={1.5} />
                  Customer support
                </Link>
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={signOut}
                className="w-full justify-start px-2.5 text-[13px]"
              >
                <LogOut size={15} strokeWidth={1.5} />
                Log out
              </Button>
            </div>
          </nav>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
