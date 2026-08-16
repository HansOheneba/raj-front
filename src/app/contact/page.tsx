import type { Metadata } from "next";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ContactForm } from "@/components/contact/ContactForm";
import { SocialIcon } from "@/components/layout/SocialIcon";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: "Support",
  description: "Raj Kollections support. WhatsApp and phone for questions. Place orders in the shop.",
};

export default function ContactPage() {
  const { contact, socials } = siteConfig;

  return (
    <div className="shell py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Support" }]} />
      <div className="mt-4 border-b border-line pb-6">
        <SectionHeading
          as="h1"
          eyebrow="Support"
          title="Questions only"
          description="Place orders in the shop. Use WhatsApp or this form if you need help with a product or an existing order."
        />
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_260px] lg:gap-16">
        <ContactForm />
        <aside className="flex flex-col gap-7 lg:border-l lg:border-line lg:pl-8">
          <div>
            <h2 className="label-xs pb-2.5 text-ink">Visit</h2>
            <div className="flex items-start gap-2.5 border-t border-line pt-3">
              <MapPin size={14} strokeWidth={1.5} className="mt-0.5 shrink-0 text-clay" />
              <address className="text-[13px] not-italic leading-relaxed text-ink-muted">
                {contact.address.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
            </div>
          </div>
          <div>
            <h2 className="label-xs pb-2.5 text-ink">Direct</h2>
            <ul className="flex flex-col gap-2 border-t border-line pt-3">
              <li>
                <a
                  href={`https://wa.me/${contact.whatsapp}`}
                  className="flex items-center gap-2.5 text-[13px] text-ink-muted hover:text-clay"
                >
                  <MessageCircle size={14} strokeWidth={1.5} className="shrink-0 text-clay" />
                  WhatsApp support
                </a>
              </li>
              <li>
                <a
                  href={`tel:${contact.phone.replace(/\s/g, "")}`}
                  className="flex items-center gap-2.5 text-[13px] text-ink-muted hover:text-clay"
                >
                  <Phone size={14} strokeWidth={1.5} className="shrink-0 text-clay" />
                  {contact.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${contact.email}`}
                  className="flex items-center gap-2.5 text-[13px] text-ink-muted hover:text-clay"
                >
                  <Mail size={14} strokeWidth={1.5} className="shrink-0 text-clay" />
                  {contact.email}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="label-xs pb-2.5 text-ink">Follow</h2>
            <div className="flex items-center gap-1.5 border-t border-line pt-3">
              {socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={social.label}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-line text-ink-muted hover:border-clay hover:text-clay"
                >
                  <SocialIcon name={social.label} />
                </a>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
