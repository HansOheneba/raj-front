import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: "About",
  description: "Raj Kollections. UK and US goods you won't easily find on Accra shelves.",
};

export default function AboutPage() {
  return (
    <div className="shell py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "About" }]} />
      <section className="mt-6 grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-14">
        <div className="max-w-lg">
          <p className="label-xs text-clay">Accra</p>
          <h1 className="mt-3 text-[2rem] sm:text-[2.5rem]">The imports most shelves skip.</h1>
          <p className="mt-5 text-[13px] leading-relaxed text-ink-muted">
            We carry the UK and US biscuits, drinks and everyday brands you&apos;d expect to find
            abroad — the ones most Accra supermarkets don&apos;t stock. Not affiliated with the
            brands we carry.
          </p>
          <p className="mt-3 text-[13px] leading-relaxed text-ink-muted">
            Order and pay right here — Hubtel handles checkout. WhatsApp is there afterward if you
            need us.
          </p>
          <p className="mt-3 text-[13px] leading-relaxed text-ink-muted">{siteConfig.deliveryNote}</p>
          <div className="mt-7">
            <Button asChild>
              <Link href="/shop">Shop all</Link>
            </Button>
          </div>
        </div>
        <div className="relative aspect-4/5 overflow-hidden rounded-md border border-line">
          <Image
            src="/images/editorial/about-store.jpg"
            alt="Raj Kollections"
            fill
            priority
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="object-cover"
          />
        </div>
      </section>
    </div>
  );
}
