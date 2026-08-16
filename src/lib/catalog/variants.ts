import type { AttributeMap, ProductVariant } from "./types";

export type OptionAxis = {
  name: string;
  values: string[];
};

export function optionAxes(variants: ProductVariant[]): OptionAxis[] {
  const order: string[] = [];
  const values = new Map<string, string[]>();

  for (const variant of variants) {
    for (const [key, value] of Object.entries(variant.attributes)) {
      if (!values.has(key)) {
        order.push(key);
        values.set(key, []);
      }
      const list = values.get(key);
      if (list && !list.includes(value)) list.push(value);
    }
  }

  return order.map((name) => ({ name, values: values.get(name) ?? [] }));
}

export function matchingVariant(
  variants: ProductVariant[],
  selected: AttributeMap,
): ProductVariant | undefined {
  return variants.find((variant) =>
    Object.entries(selected).every(([key, value]) => variant.attributes[key] === value),
  );
}

export function availableValues(
  variants: ProductVariant[],
  axis: string,
  selected: AttributeMap,
): Set<string> {
  const others = { ...selected };
  delete others[axis];

  const set = new Set<string>();
  for (const variant of variants) {
    const matches = Object.entries(others).every(
      ([key, value]) => !value || variant.attributes[key] === value,
    );
    if (matches && variant.attributes[axis]) set.add(variant.attributes[axis]);
  }
  return set;
}

export function defaultSelection(variants: ProductVariant[]): AttributeMap {
  const first = variants.find((variant) => variant.stock > 0) ?? variants[0];
  return first ? { ...first.attributes } : {};
}

export function variantHint(variants: ProductVariant[] | undefined): string | undefined {
  if (!variants || variants.length === 0) return undefined;
  const axes = optionAxes(variants);
  if (axes.length === 0) return undefined;
  if (axes.length === 1 && axes[0].values.length <= 4) {
    return axes[0].values.join(" · ");
  }
  return axes
    .map((axis) => {
      const count = axis.values.length;
      const label = axis.name.toLowerCase();
      return `${count} ${label}${count === 1 ? "" : "s"}`;
    })
    .join(" · ");
}

export function needsVariantChoice(variants: ProductVariant[] | undefined): boolean {
  if (!variants || variants.length <= 1) return false;
  return optionAxes(variants).some((axis) => axis.values.length > 1);
}

export function optionLabel(attributes: AttributeMap): string {
  return Object.values(attributes).join(" · ");
}
