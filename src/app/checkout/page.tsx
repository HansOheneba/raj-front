import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Delivery details for your Raj Kollections order. Payment is processed via the admin Hubtel flow.",
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
        Enter delivery details. Charging happens on the admin side when Hubtel is connected.
      </p>
      <div className="mt-8">
        <CheckoutForm />
      </div>
    </div>
  );
}
