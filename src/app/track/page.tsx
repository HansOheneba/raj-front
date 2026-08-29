import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { TrackLookup } from "@/components/track/TrackLookup";

export const metadata: Metadata = {
  title: "Track an order",
  description: "Look up an order with a tracking number. No sign-in needed.",
};

export default function TrackPage() {
  return (
    <div className="shell py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Track an order" }]} />
      <div className="mx-auto mt-6 max-w-md">
        <h1 className="text-2xl sm:text-[1.75rem]">Track an order</h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
          Enter the number from your order.
        </p>
        <div className="mt-6">
          <TrackLookup />
        </div>
      </div>
    </div>
  );
}
