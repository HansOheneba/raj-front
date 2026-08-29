"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, Loader2, ShoppingBag, Smartphone } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { OrderSummary } from "@/components/cart/OrderSummary";
import { AuthForm } from "@/components/customer/AuthForm";
import { useCustomer } from "@/components/customer/CustomerProvider";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { createOrder, type CheckoutCustomer } from "@/lib/checkout";
import { LocationFields } from "@/components/customer/LocationFields";
import { MapsLinkField } from "@/components/customer/MapsLinkField";
import { formatLocationLine } from "@/lib/customer/locations";
import { formatPrice } from "@/lib/utils";

const NEW_ADDRESS = "new";
const PAYMENT_DELAY_MS = 1500;

type CheckoutStep = "details" | "payment" | "success";

type PlacedOrder = {
  reference: string;
  orderId: string;
  trackingNumber: string;
  total: number;
};

type PendingCheckout = {
  customer: CheckoutCustomer;
  isNewAddress: boolean;
};

export function CheckoutForm() {
  const { ready, lines, count, subtotal, shipping, total, clear } = useCart();
  const { ready: customerReady, customer, addresses, addAddress } = useCustomer();
  const [step, setStep] = useState<CheckoutStep>("details");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);
  const [pendingCheckout, setPendingCheckout] = useState<PendingCheckout | null>(null);
  const defaultAddressId =
    addresses.find((address) => address.isDefault)?.id ?? addresses[0]?.id ?? NEW_ADDRESS;
  const [addressChoice, setAddressChoice] = useState<string | null>(null);
  const selectedAddressId = addressChoice ?? defaultAddressId;
  const selectedAddress = addresses.find((address) => address.id === selectedAddressId);

  useEffect(() => {
    if (lines.length === 0 && step !== "success") {
      setStep("details");
      setPendingCheckout(null);
    }
  }, [lines.length, step]);

  if (!ready || !customerReady) {
    return (
      <div className="grid gap-10 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
        <Skeleton className="h-64 w-full rounded-lg lg:sticky lg:top-[76px] lg:self-start" />
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
          We&apos;ve received your order. Keep your reference if you need support.
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
        <div className="mt-6 flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <Button asChild className="w-full">
              <Link href={`/account/orders/${placed.orderId}`}>View order</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href={`/track/${encodeURIComponent(placed.trackingNumber)}`}>Track order</Link>
            </Button>
          </div>
          <Button asChild variant="ghost">
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

  if (!customer) {
    return (
      <div className="mx-auto grid max-w-md gap-2">
        <AuthForm reason="checkout" />
      </div>
    );
  }

  const buildCustomerFromForm = (form: FormData): CheckoutCustomer => {
    const mapsUrl = String(form.get("mapsUrl") ?? "").trim();
    return {
      name: String(form.get("name") ?? ""),
      phone: String(form.get("phone") ?? ""),
      email: String(form.get("email") ?? ""),
      region: String(form.get("region") ?? ""),
      city: String(form.get("city") ?? ""),
      address: String(form.get("address") ?? ""),
      mapsUrl: mapsUrl || undefined,
      notes: String(form.get("notes") ?? "") || undefined,
    };
  };

  const submitDetails = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const isNewAddress = !selectedAddress || selectedAddressId === NEW_ADDRESS;
    setPendingCheckout({ customer: buildCustomerFromForm(form), isNewAddress });
    setStep("payment");
  };

  const saveCheckoutAddress = (checkout: CheckoutCustomer) => {
    const draft = {
      label: addresses.length === 0 ? "Home" : checkout.city,
      name: checkout.name,
      phone: checkout.phone,
      region: checkout.region,
      city: checkout.city,
      line: checkout.address,
      mapsUrl: checkout.mapsUrl,
      isDefault: addresses.length === 0,
    };

    const duplicate = addresses.some(
      (address) =>
        address.line.trim().toLowerCase() === draft.line.trim().toLowerCase() &&
        address.city.trim().toLowerCase() === draft.city.trim().toLowerCase() &&
        address.region === draft.region,
    );

    if (!duplicate) {
      addAddress(draft);
    }
  };

  const payWithMobileMoney = async () => {
    if (!pendingCheckout || !customer) return;
    setError(null);
    setPending(true);

    await new Promise((resolve) => window.setTimeout(resolve, PAYMENT_DELAY_MS));

    const result = await createOrder({
      customerId: customer.id,
      customer: pendingCheckout.customer,
      lines: lines.map((line) => ({
        productId: line.productId,
        variantId: line.variantId,
        slug: line.snapshot.slug,
        quantity: line.quantity,
        name: line.snapshot.name,
        price: line.snapshot.price,
        imageUrl: line.snapshot.imageUrl,
        attributes: line.snapshot.optionLabel
          ? { Option: line.snapshot.optionLabel }
          : undefined,
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

    if (pendingCheckout.isNewAddress) {
      saveCheckoutAddress(pendingCheckout.customer);
    }

    clear();
    setPendingCheckout(null);
    setPlaced({
      reference: result.reference,
      orderId: result.orderId,
      trackingNumber: result.trackingNumber,
      total,
    });
    setStep("success");
  };

  if (step === "payment" && pendingCheckout) {
    return (
      <div className="grid gap-10 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="flex flex-col gap-4">
          <div>
            <p className="label-xs text-clay">Secure checkout</p>
            <h2 className="mt-1 text-xl">Pay with Mobile Money</h2>
            <p className="mt-1.5 text-[13px] text-ink-muted">
              Demo payment. Your order will be placed once payment is confirmed.
            </p>
          </div>

          <div className="rounded-lg border border-line bg-cream p-4">
            <div className="flex items-center justify-between gap-3 text-[13px]">
              <span className="text-ink-muted">Amount due</span>
              <span className="text-lg font-medium tabular-nums text-ink">{formatPrice(total)}</span>
            </div>
            <p className="mt-2 text-[13px] text-ink-muted">
              Delivering to{" "}
              {formatLocationLine({
                line: pendingCheckout.customer.address,
                city: pendingCheckout.customer.city,
                region: pendingCheckout.customer.region,
              })}
            </p>
          </div>

          {error && <p className="text-[13px] text-sale">{error}</p>}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" onClick={payWithMobileMoney} disabled={pending} className="gap-2">
              {pending ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Processing
                </>
              ) : (
                <>
                  <Smartphone size={15} strokeWidth={1.5} />
                  Pay {formatPrice(total)}
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => {
                setStep("details");
                setError(null);
              }}
            >
              Back
            </Button>
          </div>
        </div>
        <div className="lg:sticky lg:top-[76px] lg:self-start">
          <OrderSummary showProgress={false} />
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submitDetails} className="grid gap-10 lg:grid-cols-[1fr_320px] lg:items-start">
      <div className="flex flex-col gap-3.5">
        <p className="text-[13px] text-ink-muted">
          {count} {count === 1 ? "item" : "items"}.
        </p>
        <Field label="Full name" htmlFor="name" required>
          <Input
            id="name"
            name="name"
            required
            autoComplete="name"
            defaultValue={selectedAddress?.name ?? customer.name}
            key={`name-${selectedAddressId}`}
          />
        </Field>
        <Field label="Phone" htmlFor="phone" required>
          <PhoneInput
            id="phone"
            name="phone"
            required
            defaultValue={selectedAddress?.phone ?? customer.phone}
            key={`phone-${selectedAddressId}`}
          />
        </Field>
        <Field label="Email" htmlFor="email" required>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            defaultValue={customer.email}
          />
        </Field>

        {addresses.length > 0 && (
          <fieldset>
            <legend className="label-xs text-ink-muted">Deliver to</legend>
            <div className="mt-1.5 flex flex-col gap-1.5">
              {addresses.map((address) => (
                <label
                  key={address.id}
                  className={`flex cursor-pointer items-start gap-2.5 rounded-md border bg-cream px-3 py-2.5 text-[13px] ${
                    selectedAddressId === address.id ? "border-clay" : "border-line"
                  }`}
                >
                  <input
                    type="radio"
                    name="addressId"
                    value={address.id}
                    checked={selectedAddressId === address.id}
                    onChange={() => setAddressChoice(address.id)}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="font-medium text-ink">{address.label}</span>
                    <span className="mt-0.5 block text-ink-muted">
                      {formatLocationLine({
                        line: address.line,
                        city: address.city,
                        region: address.region,
                      })}
                    </span>
                  </span>
                </label>
              ))}
              <label
                className={`flex cursor-pointer items-start gap-2.5 rounded-md border bg-cream px-3 py-2.5 text-[13px] ${
                  selectedAddressId === NEW_ADDRESS ? "border-clay" : "border-line"
                }`}
              >
                <input
                  type="radio"
                  name="addressId"
                  value={NEW_ADDRESS}
                  checked={selectedAddressId === NEW_ADDRESS}
                  onChange={() => setAddressChoice(NEW_ADDRESS)}
                  className="mt-0.5"
                />
                <span className="font-medium text-ink">A different address</span>
              </label>
            </div>
          </fieldset>
        )}

        {selectedAddress ? (
          <>
            <input type="hidden" name="region" value={selectedAddress.region} />
            <input type="hidden" name="city" value={selectedAddress.city} />
            <input type="hidden" name="address" value={selectedAddress.line} />
            {selectedAddress.mapsUrl && (
              <input type="hidden" name="mapsUrl" value={selectedAddress.mapsUrl} />
            )}
          </>
        ) : (
          <>
            <LocationFields idPrefix="checkout" />
            <Field label="Street address" htmlFor="address" required hint="House number, street, landmark.">
              <Textarea id="address" name="address" required rows={3} />
            </Field>
            <MapsLinkField id="mapsUrl" />
          </>
        )}

        <Field label="Notes" htmlFor="notes">
          <Textarea id="notes" name="notes" rows={2} />
        </Field>
        {error && <p className="text-[13px] text-sale">{error}</p>}
        <Button type="submit">Continue to payment</Button>
      </div>
      <div className="lg:sticky lg:top-[76px] lg:self-start">
        <OrderSummary showProgress={false} />
      </div>
    </form>
  );
}
