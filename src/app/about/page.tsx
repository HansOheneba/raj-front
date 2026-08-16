import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: "About",
  description:
    "Everyday essentials, beauty, fashion and hard-to-find favourites. Shop from anywhere in Ghana.",
};

export default function AboutPage() {
  return (
    <div className="shell py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "About" }]} />
      <section className="mt-6 grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-14">
        <div className="max-w-lg">
          <p className="label-xs text-clay">Ghana</p>
          <h1 className="mt-3 text-[2rem] sm:text-[2.5rem]">
            The things you need. A few you haven&apos;t met yet.
          </h1>
          <p className="mt-5 text-[13px] leading-relaxed text-ink-muted">
            Pantry staples, beauty, fashion and international favourites from brands you know.
            Genuine products, easy to shop from anywhere in Ghana. Not affiliated with the brands
            we carry.
          </p>
          <p className="mt-3 text-[13px] leading-relaxed text-ink-muted">
            Secure checkout. We don&apos;t store your payment information. Need a hand? We&apos;re
            on WhatsApp.
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
