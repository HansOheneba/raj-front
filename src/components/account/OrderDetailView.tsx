"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import { useCustomer } from "@/components/customer/CustomerProvider";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getOrderById, type Order } from "@/lib/orders";
import { OrderCard } from "./OrderCard";

export function OrderDetailView({ orderId }: { orderId: string }) {
  const { customer } = useCustomer();
  const [order, setOrder] = useState<Order | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    void getOrderById(orderId, customer?.id).then((result) => {
      if (!cancelled) {
        setOrder(result);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [orderId, customer?.id]);

  if (loading) {
    return (
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-6 h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (!order) {
    return (
      <EmptyState
        icon={<Package size={17} strokeWidth={1.5} />}
        title="This order isn't on this account"
        description="Sign in with the phone number used when it was placed. You can still follow it with the tracking number."
        action={
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button asChild>
              <Link href="/account">My orders</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/track">Track an order</Link>
            </Button>
          </div>
        }
      />
    );
  }

  return (
    <div>
      <h1 className="text-2xl sm:text-[1.75rem]">Order #{order.id}</h1>
      <p className="mt-1.5 text-[13px] text-ink-muted">
        <Link href="/account" className="text-clay underline decoration-clay/40 underline-offset-2">
          My orders
        </Link>
      </p>
      <div className="mt-6">
        <OrderCard order={order} customerName={customer?.name ?? order.address.name} />
      </div>
    </div>
  );
}
