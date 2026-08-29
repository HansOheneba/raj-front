import type { Metadata } from "next";
import { TrackOrderPageView } from "@/components/track/TrackOrderPageView";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { normalizeTrackingNumber } from "@/lib/orders";

type PageProps = { params: Promise<{ number: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { number } = await params;
  const trackingNumber = normalizeTrackingNumber(decodeURIComponent(number));
  if (!trackingNumber) return { title: "Track an order" };
  return {
    title: trackingNumber,
    description: "See where this order is.",
  };
}

export default async function TrackNumberPage({ params }: PageProps) {
  const { number } = await params;
  const trackingNumber = normalizeTrackingNumber(decodeURIComponent(number));

  return (
    <div className="shell py-8">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Track an order", href: "/track" },
          { label: trackingNumber || "Lookup" },
        ]}
      />
      <TrackOrderPageView trackingNumber={trackingNumber} />
    </div>
  );
}
