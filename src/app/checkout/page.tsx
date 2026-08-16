import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Secure checkout. We don't store your payment information.",
};

export default function CheckoutPage() {
  return (
    <div className="shell py-8">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Cart", href: "/cart" },
          { label: "Checkout" },
        ]}
      />
      <h1 className="mt-4 text-2xl sm:text-[1.75rem]">Checkout</h1>
      <p className="mt-1.5 text-[13px] text-ink-muted">
        {siteConfig.deliveryNote} Secure checkout. We don&apos;t store your payment information.
      </p>
      <div className="mt-8">
        <CheckoutForm />
      </div>
    </div>
  );
}
