"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { OrderSummary } from "@/components/cart/OrderSummary";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { createOrder } from "@/lib/checkout/createOrder";
import { formatPrice } from "@/lib/utils";

const regions = [
  "Greater Accra",
  "Ashanti",
  "Central",
  "Eastern",
  "Northern",
  "Volta",
  "Western",
];

export function CheckoutForm() {
  const { ready, lines, count, subtotal, shipping, total, clear } = useCart();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [placed, setPlaced] = useState<{ reference: string; total: number } | null>(null);

  if (!ready) {
    return (
      <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (placed) {
    return (
      <div className="mx-auto max-w-md rounded-lg border border-line bg-cream p-8 text-center">
        <span className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-clay-soft text-clay">
          <Check size={18} strokeWidth={1.5} />
        </span>
        <h2 className="text-xl">Order received</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
          Payment is handled by the admin Hubtel flow. Keep your reference for support.
        </p>
        <dl className="mt-5 flex flex-col gap-2 border-y border-line py-3 text-left text-[13px]">
          <div className="flex justify-between gap-3">
            <dt className="text-ink-muted">Reference</dt>
            <dd className="tabular-nums text-ink">{placed.reference}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-ink-muted">Total</dt>
            <dd className="tabular-nums text-ink">{formatPrice(placed.total)}</dd>
          </div>
        </dl>
        <div className="mt-6">
          <Button asChild>
            <Link href="/shop">Keep shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag size={17} strokeWidth={1.5} />}
        title="Nothing to check out"
        description="Add items first."
        action={
          <Button asChild>
            <Link href="/shop">Browse the shop</Link>
          </Button>
        }
      />
    );
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(event.currentTarget);
    const result = await createOrder({
      customer: {
        name: String(form.get("name") ?? ""),
        phone: String(form.get("phone") ?? ""),
        email: String(form.get("email") ?? ""),
        region: String(form.get("region") ?? ""),
        address: String(form.get("address") ?? ""),
        notes: String(form.get("notes") ?? "") || undefined,
      },
      lines: lines.map((line) => ({
        productId: line.productId,
        variantId: line.variantId,
        quantity: line.quantity,
        name: line.snapshot.name,
        price: line.snapshot.price,
      })),
      subtotal,
      shipping,
      total,
    });
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    clear();
    setPlaced({ reference: result.reference, total });
  };

  return (
    <form onSubmit={submit} className="grid gap-10 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-3.5">
        <p className="text-[13px] text-ink-muted">
          {count} items. Payment runs on the admin Hubtel integration when it is live.
        </p>
        <Field label="Full name" htmlFor="name" required>
          <Input id="name" name="name" required autoComplete="name" />
        </Field>
        <Field label="Phone" htmlFor="phone" required>
          <Input id="phone" name="phone" required autoComplete="tel" />
        </Field>
        <Field label="Email" htmlFor="email" required>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </Field>
        <Field label="Region" htmlFor="region" required>
          <select
            id="region"
            name="region"
            required
            defaultValue={regions[0]}
            className="h-9 w-full rounded-md border border-input bg-cream px-3 text-[13px] outline-none"
          >
            {regions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Delivery address" htmlFor="address" required>
          <Textarea id="address" name="address" required rows={3} />
        </Field>
        <Field label="Notes" htmlFor="notes">
          <Textarea id="notes" name="notes" rows={2} />
        </Field>
        {error && <p className="text-[13px] text-sale">{error}</p>}
        <Button type="submit" disabled={pending}>
          {pending ? "Sending" : "Place order"}
        </Button>
      </div>
      <OrderSummary showProgress={false} />
    </form>
  );
}
