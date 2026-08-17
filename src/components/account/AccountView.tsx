"use client";

import Link from "next/link";
import { ArrowRight, Heart, ShoppingBag } from "lucide-react";
import { AddressBook } from "@/components/customer/AddressBook";
import { AuthForm } from "@/components/customer/AuthForm";
import { useCustomer } from "@/components/customer/CustomerProvider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSaved } from "@/components/saved/SavedProvider";
import { formatGhanaPhone } from "@/lib/phone";

export function AccountView() {
  const { ready, customer, signOut } = useCustomer();
  const { count } = useSaved();

  if (!ready) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-3">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="mx-auto max-w-md">
        <AuthForm reason="account" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <p className="label-xs text-ink-muted">Signed in</p>
      <h2 className="mt-1.5 text-xl">{customer.name}</h2>
      <dl className="mt-5 flex flex-col gap-2 border-y border-line py-4 text-[13px]">
        <div className="flex justify-between gap-3">
          <dt className="text-ink-muted">Email</dt>
          <dd className="text-ink">{customer.email}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-ink-muted">Phone</dt>
          <dd className="text-ink">{formatGhanaPhone(customer.phone)}</dd>
        </div>
      </dl>

      <AddressBook />

      <div className="mt-8 flex flex-col gap-2">
        <Button asChild variant="outline" className="justify-between">
          <Link href="/saved">
            <span className="inline-flex items-center gap-1.5">
              <Heart size={14} strokeWidth={1.5} />
              Your list
            </span>
            <span className="inline-flex items-center gap-1 text-ink-muted">
              {count}
              <ArrowRight size={14} strokeWidth={1.5} />
            </span>
          </Link>
        </Button>
        <Button asChild variant="outline" className="justify-between">
          <Link href="/cart">
            <span className="inline-flex items-center gap-1.5">
              <ShoppingBag size={14} strokeWidth={1.5} />
              Cart
            </span>
            <ArrowRight size={14} strokeWidth={1.5} />
          </Link>
        </Button>
      </div>

      <button
        type="button"
        onClick={signOut}
        className="mt-6 text-[13px] text-ink-muted underline decoration-line-strong underline-offset-2 hover:text-ink"
      >
        Sign out
      </button>
    </div>
  );
}
