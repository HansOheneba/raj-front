"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import { TrackLookup } from "@/components/track/TrackLookup";
import { TrackingStatus } from "@/components/track/TrackingStatus";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { getOrderByTrackingNumber, type Order } from "@/lib/orders";

export function TrackOrderPageView({ trackingNumber }: { trackingNumber: string }) {
  const [order, setOrder] = useState<Order | undefined>();
  const [loading, setLoading] = useState(true);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    void getOrderByTrackingNumber(trackingNumber).then((result) => {
      if (!cancelled) {
        setOrder(result);
        setResolved(true);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [trackingNumber]);

  if (loading) {
    return (
      <div className="mt-8 max-w-5xl">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="mt-8 h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (order) {
    return (
      <div className="mt-6 max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-5">
          <div>
            <p className="label-xs text-clay">Track an order</p>
            <h1 className="mt-2 text-2xl sm:text-[1.75rem]">{order.trackingNumber}</h1>
          </div>
          <Link
            href="/track"
            className="text-[13px] text-clay underline decoration-clay/40 underline-offset-2"
          >
            Look up another
          </Link>
        </div>
        <div className="mt-8">
          <TrackingStatus order={order} />
        </div>
      </div>
    );
  }

  if (!resolved) return null;

  return (
    <div className="mx-auto mt-6 max-w-md">
      <EmptyState
        icon={<Package size={17} strokeWidth={1.5} />}
        title="We couldn't find that order"
        description="Check the tracking number and try again. Try RK-73262."
      />
      <div className="mt-6">
        <TrackLookup defaultValue={trackingNumber} />
      </div>
    </div>
  );
}
