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
    <div className="rail -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-x-6 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4 xl:grid-cols-5">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          departmentName={departmentNameFor(product, departments)}
          className="w-[46vw] shrink-0 snap-start sm:w-auto"
        />
      ))}
    </div>
  );
}
