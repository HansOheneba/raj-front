"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Download, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatLocationLine } from "@/lib/customer/locations";
import { downloadInvoice } from "@/lib/orders/invoice";
import {
  formatDeliveryDate,
  formatOrderPlacedAt,
  orderStatusClass,
  orderStatusLabel,
  type Order,
} from "@/lib/orders";
import { cn, formatPrice, pluralize } from "@/lib/utils";

export function OrderCard({
  order,
  customerName,
  showTrack = true,
}: {
  order: Order;
  customerName: string;
  showTrack?: boolean;
}) {
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

  const handleDownloadInvoice = async () => {
    setDownloadingInvoice(true);
    try {
      await downloadInvoice(order, customerName);
    } finally {
      setDownloadingInvoice(false);
    }
  };

  return (
    <article className="rounded-lg border border-line bg-cream p-4 sm:p-5">
      <div className="flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-[15px] font-medium">Order #{order.id}</h3>
          <p className="mt-1 text-[12px] text-ink-muted">
            {pluralize(order.lines.length, "product")} · {customerName} · {formatOrderPlacedAt(order.placedAt)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {showTrack && order.trackingNumber && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/track/${order.trackingNumber}`}>Track</Link>
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={downloadingInvoice}
            onClick={() => void handleDownloadInvoice()}
          >
            {downloadingInvoice ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} strokeWidth={1.5} />
            )}
            Download invoice
          </Button>
        </div>
      </div>

      <dl className="grid gap-2.5 py-4 text-[13px] sm:grid-cols-[140px_1fr]">
        <dt className="text-ink-muted">Status</dt>
        <dd className={cn("font-medium", orderStatusClass[order.status])}>
          {orderStatusLabel[order.status]}
        </dd>

        <dt className="text-ink-muted">Date of delivery</dt>
        <dd>{formatDeliveryDate(order.deliveryDate)}</dd>

        <dt className="text-ink-muted">Delivered to</dt>
        <dd>
          <span className="block">{order.address.name}</span>
          <span className="mt-0.5 flex items-start gap-1 text-ink-muted">
            <MapPin size={12} strokeWidth={1.5} className="mt-0.5 shrink-0" />
            <span>
              {formatLocationLine({
                line: order.address.line,
                city: order.address.city,
                region: order.address.region,
              })}
            </span>
          </span>
        </dd>

        <dt className="text-ink-muted">Total</dt>
        <dd className="font-medium tabular-nums">{formatPrice(order.total)}</dd>
      </dl>

      <ul className="grid gap-3 border-t border-line pt-4 sm:grid-cols-2">
        {order.lines.map((line) => (
          <li key={`${order.id}-${line.productId}-${line.slug}`} className="flex gap-3">
            <Link
              href={`/product/${line.slug}`}
              className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-line"
            >
              <Image src={line.imageUrl} alt="" fill sizes="64px" className="object-cover" />
            </Link>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium">
                <Link href={`/product/${line.slug}`} className="hover:text-clay">
                  {line.name}
                </Link>
              </p>
              <p className="mt-0.5 text-[12px] text-ink-muted">
                Quantity {line.quantity} · {formatPrice(line.unitPrice * line.quantity)}
              </p>
              {Object.entries(line.attributes).map(([key, value]) => (
                <p key={key} className="text-[12px] text-ink-muted">
                  {key} {value}
                </p>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </article>
  );
}
