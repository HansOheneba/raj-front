import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  linkLabel = "View all",
  align = "left",
  as: Tag = "h2",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
  align?: "left" | "center";
  as?: "h1" | "h2" | "h3";
  className?: string;
}) {
  const centered = align === "center";

  return (
    <div
      className={cn(
        "flex gap-3",
        centered
          ? "flex-col items-center text-center"
          : "flex-col sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className={cn("max-w-xl", centered && "mx-auto")}>
        {eyebrow && <p className="label-xs mb-2 text-clay">{eyebrow}</p>}
        <Tag className={cn(Tag === "h1" ? "text-3xl sm:text-4xl" : "text-xl sm:text-2xl")}>
          {title}
        </Tag>
        {description && (
          <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">{description}</p>
        )}
      </div>

      {href && (
        <Link
          href={href}
          className="label-sm group inline-flex shrink-0 items-center gap-1.5 text-ink-muted transition-colors duration-200 hover:text-clay"
        >
          {linkLabel}
          <ArrowRight
            size={13}
            strokeWidth={1.5}
            className="transition-transform duration-200 group-hover:translate-x-0.5"
          />
        </Link>
      )}
    </div>
  );
}
