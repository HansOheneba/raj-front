import { ProductCard, departmentNameFor } from "./ProductCard";
import { cn } from "@/lib/utils";
import type { Department, Product } from "@/lib/catalog";

export function ProductGrid({
  products,
  departments = [],
  columns = 4,
  priorityCount = 0,
  className,
}: {
  products: Product[];
  departments?: Department[];
  columns?: 3 | 4;
  priorityCount?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6",
        columns === 4
          ? "sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
          : "sm:grid-cols-3",
        className,
      )}
    >
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          departmentName={departmentNameFor(product, departments)}
          priority={index < priorityCount}
        />
      ))}
    </div>
  );
}
