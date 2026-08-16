import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Department } from "@/lib/catalog";

export function DepartmentCard({
  department,
  count,
  className,
}: {
  department: Department;
  count?: number;
  className?: string;
}) {
  return (
    <Link
      href={`/shop/${department.slug}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-md border border-line bg-cream transition-[border-color] duration-[var(--duration-ui)] ease-[var(--ease-out)] hover:border-line-strong",
        className,
      )}
    >
      <div className="relative aspect-square w-full overflow-hidden">
        <Image
          src={department.image}
          alt=""
          fill
          sizes="(min-width: 1024px) 16vw, (min-width: 640px) 30vw, 45vw"
          className="object-cover hover-zoom"
        />
      </div>
      <div className="flex flex-col gap-0.5 px-3 py-2.5">
        <span className="text-[13px] font-medium leading-snug text-ink">{department.name}</span>
        <span className="text-[11px] text-ink-faint">
          {count !== undefined ? `${count} items` : department.description}
        </span>
      </div>
    </Link>
  );
}
