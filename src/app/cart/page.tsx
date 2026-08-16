import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CartView } from "@/components/cart/CartView";

export const metadata: Metadata = {
  title: "Your cart",
  description: "Review the items in your RAJ KOLLECTIONS basket before checking out.",
};

export default function CartPage() {
  return (
    <div className="shell py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Cart" }]} />
      <h1 className="mt-4 text-2xl sm:text-[1.75rem]">Your cart</h1>
      <div className="mt-8">
        <CartView />
      </div>
    </div>
  );
}
