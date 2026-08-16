import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { PriceTag } from "@/components/ui/PriceTag";
import { QuickAddButton } from "./QuickAddButton";
import { cn } from "@/lib/utils";
import type { Department, Product } from "@/lib/catalog";
import { variantHint } from "@/lib/catalog/variants";

export function ProductCard({
  product,
  departmentName,
  priority = false,
  className,
}: {
  product: Product;
  departmentName?: string;
  priority?: boolean;
  className?: string;
}) {
  const onSale = Boolean(product.compareAtPrice && product.compareAtPrice > product.price);
  const isNew = product.tags?.includes("new");
  const hint = variantHint(product.variants) ?? Object.values(product.attributes)[0];

  return (
    <article className={cn("group relative flex flex-col", className)}>
      <div className="relative overflow-hidden rounded-md border border-line bg-cream">
        <Link href={`/product/${product.slug}`} className="block" tabIndex={-1} aria-hidden>
          <div className="relative aspect-square w-full overflow-hidden">
            <Image
              src={product.imageUrls[0]}
              alt=""
              fill
              sizes="(min-width: 1280px) 18vw, (min-width: 1024px) 22vw, (min-width: 640px) 30vw, 45vw"
              priority={priority}
              className="object-cover hover-zoom"
            />
          </div>
        </Link>

        <div className="pointer-events-none absolute left-2 top-2 flex flex-col items-start gap-1">
          {onSale && <Badge variant="sale">Sale</Badge>}
          {isNew && !onSale && <Badge variant="new">New</Badge>}
          {!product.inStock && <Badge variant="outline">Sold out</Badge>}
        </div>

        <QuickAddButton product={product} />
      </div>

      <div className="mt-2.5 flex flex-1 flex-col gap-1">
        <p className="label-xs text-ink-faint">{departmentName ?? product.brand ?? hint}</p>
        <h3 className="text-[14px] font-medium leading-snug">
          <Link href={`/product/${product.slug}`} className="transition-colors duration-[var(--duration-ui)] ease-[var(--ease-out)] hover:text-clay">
            {product.name}
          </Link>
        </h3>
        {hint && <p className="text-[11px] text-ink-muted">{hint}</p>}
        <div className="mt-auto pt-1">
          <PriceTag price={product.price} compareAtPrice={product.compareAtPrice} size="md" />
        </div>
      </div>
    </article>
  );
}

export function departmentNameFor(
  product: Product,
  departments: Department[],
): string | undefined {
  return departments.find((department) => department.id === product.departmentId)?.name;
}
