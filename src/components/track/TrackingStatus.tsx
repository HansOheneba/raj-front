import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  formatDeliveryDate,
  formatOrderPlacedAt,
  orderStatusClass,
  orderStatusLabel,
  trackingTimeline,
  type Order,
  type TrackingStepState,
} from "@/lib/orders";
import { cn } from "@/lib/utils";

const dotClass: Record<TrackingStepState, string> = {
  done: "bg-ink",
  current: "bg-clay ring-4 ring-clay-soft",
  pending: "border border-line-strong bg-cream",
};

export function TrackingStatus({ order }: { order: Order }) {
  const steps = trackingTimeline(order);
  const showRider =
    Boolean(order.rider) && (order.status === "on_the_way" || order.status === "delivered");

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(16rem,20rem)_minmax(0,1fr)] lg:gap-14">
      <aside className="rounded-lg border border-line bg-cream p-5 lg:sticky lg:top-20">
        <p className={cn("text-xl font-medium", orderStatusClass[order.status])}>
          {orderStatusLabel[order.status]}
        </p>
        <p className="mt-1.5 text-[13px] text-ink-muted">
          {order.status === "delivered"
            ? `Delivered ${formatDeliveryDate(order.deliveryDate)}`
            : `Expected ${formatDeliveryDate(order.deliveryDate)}`}
        </p>
        {showRider && order.rider && (
          <div className="mt-4 border-t border-line pt-4">
            <p className="label-xs text-ink-muted">Rider</p>
            <p className="mt-1.5 text-[13px] font-medium text-ink">{order.rider.name}</p>
          </div>
        )}
        <div className="mt-5">
          <Button asChild>
            <Link href={`/account/orders/${order.id}`}>View order details</Link>
          </Button>
        </div>
      </aside>

      <section>
        <h2 className="label-xs text-ink-muted">Progress</h2>
        <ol className="mt-4">
          {steps.map((step, index) => (
            <li key={`${step.title}-${index}`} className="relative flex gap-3 pb-6 last:pb-0 lg:gap-4 lg:pb-7">
              {index < steps.length - 1 && (
                <span
                  aria-hidden
                  className={cn(
                    "absolute left-[5px] top-3 h-[calc(100%-4px)] w-px",
                    step.state === "pending" ? "bg-line" : "bg-line-strong",
                  )}
                />
              )}
              <span
                aria-hidden
                className={cn("relative z-10 mt-1 h-2.5 w-2.5 shrink-0 rounded-full", dotClass[step.state])}
              />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
                <div className="min-w-0">
                  <p
                    className={cn(
                      "text-[13px] font-medium",
                      step.state === "pending" ? "text-ink-faint" : "text-ink",
                    )}
                  >
                    {step.title}
                  </p>
                  {step.detail && (
                    <p
                      className={cn(
                        "mt-0.5 text-[12px]",
                        step.state === "pending" ? "text-ink-faint" : "text-ink-muted",
                      )}
                    >
                      {step.detail}
                    </p>
                  )}
                </div>
                {step.at && step.state !== "pending" && (
                  <time
                    dateTime={step.at}
                    className="shrink-0 text-[12px] text-ink-faint sm:pt-0.5 sm:text-right"
                  >
                    {formatOrderPlacedAt(step.at)}
                  </time>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
