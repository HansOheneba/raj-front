import Link from "next/link";
import { BrandLogo } from "./BrandLogo";
import { NewsletterForm } from "./NewsletterForm";
import { SocialIcon } from "./SocialIcon";
import { siteConfig } from "@/lib/config";
import type { Department } from "@/lib/catalog";

export function Footer({ departments }: { departments: Department[] }) {
  const roots = departments.filter((department) => department.parentId === null);

  return (
    <footer className="mt-20 border-t border-line bg-cream">
      <div className="shell grid grid-cols-2 gap-x-6 gap-y-8 py-10 sm:grid-cols-4 lg:grid-cols-5">
        <div className="col-span-2 lg:col-span-2">
          <BrandLogo className="h-10" size={40} />
          <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-ink-muted">
            {siteConfig.tagline} Not affiliated with the brands we carry.
          </p>
          <div className="mt-4 flex items-center gap-1.5">
            {siteConfig.socials.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={social.label}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-line text-ink-muted transition-colors duration-[var(--duration-ui)] ease-[var(--ease-out)] hover:border-clay hover:text-clay"
              >
                <SocialIcon name={social.label} />
              </a>
            ))}
          </div>
        </div>

        <nav className="flex flex-col gap-2.5">
          <h3 className="label-xs text-ink">Shop</h3>
          <ul className="flex flex-col gap-1.5">
            <li>
              <Link href="/shop" className="text-[13px] text-ink-muted hover:text-clay">
                All products
              </Link>
            </li>
            {roots.map((department) => (
              <li key={department.id}>
                <Link
                  href={`/shop/${department.slug}`}
                  className="text-[13px] text-ink-muted hover:text-clay"
                >
                  {department.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav className="flex flex-col gap-2.5">
          <h3 className="label-xs text-ink">Help</h3>
          <ul className="flex flex-col gap-1.5">
            <li>
              <Link href="/track" className="text-[13px] text-ink-muted hover:text-clay">
                Track an order
              </Link>
            </li>
            <li>
              <Link href="/contact" className="text-[13px] text-ink-muted hover:text-clay">
                Support
              </Link>
            </li>
            <li>
              <Link href="/account" className="text-[13px] text-ink-muted hover:text-clay">
                Account
              </Link>
            </li>
            <li>
              <Link href="/saved" className="text-[13px] text-ink-muted hover:text-clay">
                Your list
              </Link>
            </li>
            <li>
              <Link href="/cart" className="text-[13px] text-ink-muted hover:text-clay">
                Cart
              </Link>
            </li>
            <li>
              <Link href="/checkout" className="text-[13px] text-ink-muted hover:text-clay">
                Checkout
              </Link>
            </li>
            <li>
              <Link href="/about" className="text-[13px] text-ink-muted hover:text-clay">
                About
              </Link>
            </li>
          </ul>
        </nav>

        <div className="col-span-2 flex flex-col gap-2.5 sm:col-span-4 lg:col-span-1">
          <h3 className="label-xs text-ink">Newsletter</h3>
          <NewsletterForm compact />
        </div>
      </div>

      <div className="border-t border-line">
        <div className="shell flex flex-col items-center justify-between gap-2 py-4 sm:flex-row">
          <p className="text-[11px] text-ink-faint">
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
          <p className="text-[11px] text-ink-faint">{siteConfig.contact.address.join(" · ")}</p>
        </div>
      </div>
    </footer>
  );
}
