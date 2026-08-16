import { ProductCard, departmentNameFor } from "./ProductCard";
import type { Department, Product } from "@/lib/catalog";

export function ProductRail({
  products,
  departments = [],
}: {
  products: Product[];
  departments?: Department[];
}) {
  return (
    <div className="relative -mx-4 sm:mx-0">
      <div className="rail flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 sm:grid sm:grid-cols-3 sm:gap-x-6 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4 xl:grid-cols-5">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            departmentName={departmentNameFor(product, departments)}
            className="w-[68vw] max-w-72 shrink-0 snap-start sm:w-auto sm:max-w-none"
          />
        ))}
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-background sm:hidden"
      />
    </div>
  );
}
