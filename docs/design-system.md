# Design system

Tokens live in `src/app/globals.css` (`@theme`). Change colors and motion there. Do not invent one-off hex or durations in components.

## Tokens

- Surfaces: `ivory`, `cream`, `sand`
- Accent: `clay`, `clay-dark`, `clay-soft`
- Text: `ink`, `ink-muted`, `ink-faint`
- Motion: `--ease-out`, `--duration-press` (140ms), `--duration-ui` (200ms)

Hover scale and image zooms must sit behind `@media (hover: hover) and (pointer: fine)`.

Respect `prefers-reduced-motion`. Keep opacity changes. Drop translate and scale.

## Components

Use shadcn-style primitives in `src/components/ui/` for Button, Input, Textarea, Label, Badge, Separator, Skeleton.

Keep domain components custom: `PriceTag`, `ProductCard`, `QuantityStepper`.

When you add a shadcn primitive, merge classes with `cn(...)`. Do not replace `buttonVariants` base classes.

## Copy

Do not use em dashes. Use a period, comma, or a hyphen for ranges (`9:00-19:00`).

## Catalog

Departments and products are JSON in `src/data/` until `NEXT_PUBLIC_API_URL` points at the admin API.

To add a department, append a row in `src/data/departments.json`. Slugs are data, not TypeScript unions.

To add a product, append `src/data/products.json` with `departmentId`, GHS integer `price`, `imageUrls`, and open `attributes` (`Size`, `Volume`, `Weight`).

This storefront does not own writes, Hubtel, or order storage. Those live on the admin Vercel project.
