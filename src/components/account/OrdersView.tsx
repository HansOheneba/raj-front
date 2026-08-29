"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package } from "lucide-react";
import { useCustomer } from "@/components/customer/CustomerProvider";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  listCurrentOrdersForCustomer,
  listOrdersForCustomer,
  type Order,
} from "@/lib/orders";
import { cn } from "@/lib/utils";
import { OrderCard } from "./OrderCard";

type Tab = "current" | "all";

export function OrdersView() {
  const { customer } = useCustomer();
  const [tab, setTab] = useState<Tab>("current");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const name = customer?.name ?? "You";

  useEffect(() => {
    if (!customer) {
      setOrders([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const load = async () => {
      const items =
        tab === "current"
          ? await listCurrentOrdersForCustomer(customer.id)
          : await listOrdersForCustomer(customer.id);
      if (!cancelled) {
        setOrders(items);
        setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [customer, tab]);

  return (
    <div>
      <h1 className="text-2xl sm:text-[1.75rem]">My orders</h1>
      <div className="mt-4 flex gap-1 border-b border-line">
        {(
          [
            { id: "current", label: "Current" },
            { id: "all", label: "All orders" },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "border-b-2 px-3 py-2 text-[13px] transition-colors duration-[var(--duration-ui)] ease-[var(--ease-out)]",
              tab === item.id
                ? "border-clay text-ink"
                : "border-transparent text-ink-muted hover:text-ink",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-6 flex flex-col gap-4">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={<Package size={17} strokeWidth={1.5} />}
          title={tab === "current" ? "No orders on the way" : "No orders yet"}
          description={
            tab === "current"
              ? "When something is being packed or delivered, it will show up here."
              : "Orders you place will be listed here."
          }
          action={
            <Button asChild>
              <Link href="/shop">Start shopping</Link>
            </Button>
          }
        />
      ) : (
        <ul className="mt-6 flex flex-col gap-4">
          {orders.map((order) => (
            <li key={order.id}>
              <OrderCard order={order} customerName={name} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
