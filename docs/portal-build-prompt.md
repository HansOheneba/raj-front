# Raj Kollections Portal — build prompt

Copy everything below the line into Cursor, Claude, or your brief for the developer building the admin app.

---

Build **Raj Kollections Portal**: a **full-stack** web app that is both (1) the **internal admin** for inventory and order management and (2) the **HTTP API** consumed by the existing customer storefront (`raj-front`).

## Architecture (important)

This is **one application**, not a separate `api.*` microservice.

| App | URL | Role |
|-----|-----|------|
| **Portal** (you are building) | `https://portal.rajkollections.com` | Admin UI + API routes on the **same origin** |
| **Storefront** (already built) | `https://www.rajkollections.com` | Customer shop; sets `NEXT_PUBLIC_API_URL=https://portal.rajkollections.com` |

The storefront calls paths like `GET /catalog/products` and `POST /orders` on the portal host. Staff use the browser UI on the same app. You may implement API routes as Next.js Route Handlers, NestJS modules, or similar — but they must match the contract paths unless you add a thin rewrite layer.

**Do not** assume a dedicated `api.rajkollections.com` unless we add it later as an alias.

## Source of truth

Read and implement **`docs/admin-api-contract.json`** in the `raj-front` repo (attach it to this chat). Pay special attention to **`storefrontRequirements`** — it lists every storefront feature (departments, new arrivals, sale filter, mega menu, search, variants) and exactly which API call powers it.

The contract includes the **full current product database** (28 products, 18 departments) in `seedData`. There is no separate DB export — seed the portal from that.

Also reference seed files: `src/data/departments.json`, `src/data/products.json`.

## Critical: how the storefront uses the catalog API

The storefront is **not** a thin CRUD client. It expects rich product payloads and smart list endpoints:

| Storefront feature | API call | What portal must do |
|--------------------|----------|---------------------|
| All categories | `GET /catalog/departments` | Full tree, 18 departments |
| Mega menu (every page) | `GET /catalog/products` **no params** | Return **all** products — client builds On sale / New arrivals menus |
| Home new arrivals | `GET /catalog/products?sort=newest` | Sort by `createdAt` desc |
| Shop on sale filter | `GET /catalog/products?sale=1` | `compareAtPrice > price` |
| Shop by department | `GET /catalog/products?department=pantry` | Include child sub-departments |
| New badge on card | (fields on Product) | `tags` includes `"new"` |
| Sale badge on card | (fields on Product) | `compareAtPrice > price` |
| Search | `GET /catalog/search` or `?q=` | Match `keywords`, name, SKU, tags |
| Variants (size/weight) | (fields on Product) | Full `variants[]` with stock + price |
| Related products | `GET /catalog/products/:slug/related` | Same dept first |

**No** separate `/new-arrivals`, `/on-sale`, or `/collections` endpoints. **No** separate mega-menu endpoint unless you want to add one later — today the client computes it from the full catalog dump.

## What the portal must do

### Admin UI (staff)

- **Catalog**: CRUD departments (hierarchical), products, variants (SKU, price, stock, attributes)
- **Inventory**: Stock levels per variant; mark products in/out of stock
- **Orders**: List, filter by status, view detail, update status (`processing` → `packed` → `on_the_way` → `delivered`), assign rider name
- **Customers**: Lookup by phone; view order history (support tool)
- **Payments**: Hubtel/Mobile Money integration on order placement — storefront never talks to Hubtel directly
- **Images**: Upload or reference product images (storefront uses paths like `/images/products/...` or absolute CDN URLs)

Staff auth is **separate** from customer auth (email/password or SSO for staff; phone OTP for customers).

### Storefront API (public + customer)

Implement every endpoint in `admin-api-contract.json` → `endpoints`, in three phases:

**Phase 1 — required first**

- `GET /catalog/departments`, `/catalog/departments/:slug`
- `GET /catalog/products` (query: `department`, `q`, `min`, `max`, `stock`, `sale`, `sort`)
- `GET /catalog/products/:slug`, `/catalog/products/id/:id`, `/catalog/products/:slug/related`
- `GET /catalog/search?q=&limit=`
- `POST /orders` — validate prices/stock server-side, create immutable order snapshot, trigger MoMo payment, return `{ reference, orderId, trackingNumber, paymentReference? }`
- `GET /orders` (session), `GET /orders/:id`, `GET /orders/track/:trackingNumber` (public)

**Phase 2**

- `POST /auth/request-code`, `/auth/verify-code`, `/auth/complete-profile`, `/auth/logout`
- `GET /customer/me`, address CRUD, saved-items CRUD

**Phase 3**

- Production Hubtel flow, webhooks, reconciliation in admin

### Data model highlights

- **Departments**, not collections. Products link via `departmentId` (usually a leaf sub-department).
- **Variants**: optional array on product; each has `id`, `sku`, `attributes`, `price`, `stock`. Examples: Weight (1kg/5kg), Size (S/M/L), Color+Size for sneakers.
- **Orders**: immutable snapshot at checkout — line `name`, `unitPrice`, `attributes` frozen. No separate invoice PDF storage; storefront generates PDF client-side from order JSON. Store `paymentReference` and use `trackingNumber` as `RK-#####`.
- **Tags**: `sale`, `new` — used for promo filters.
- **Keywords**: search synonyms on products.

### Technical requirements

- **Database**: Postgres (Supabase or self-hosted). Seed from contract `seedData`.
- **CORS**: Allow `https://www.rajkollections.com` (and localhost for dev) for browser `fetch` from storefront client components (search, auth).
- **Customer sessions**: HttpOnly cookies preferred for `/orders`, `/customer/*`, `/auth/*`.
- **Catalog caching**: Storefront server components use `revalidate: 60` — responses should be cache-friendly.
- **Validation on `POST /orders`**: Recompute subtotal/shipping/total; never trust client prices blindly.
- **Phone format**: Store Ghana numbers as `233XXXXXXXXX`.

### Out of scope for v1

- Storefront cart (always client localStorage)
- Contact form / newsletter backends
- Separate `collections` CMS entity

## Suggested stack

- Next.js App Router (full-stack) **or** separate API + React admin — monorepo optional
- Postgres + Prisma/Drizzle **or** Supabase
- Hubtel for MoMo
- SMS provider for customer OTP (Africa's Talking, Hubtel SMS, etc.)

## Success criteria

1. Storefront with `NEXT_PUBLIC_API_URL=https://portal.rajkollections.com` can browse catalog, checkout, see orders in account, and track by `RK-#####`.
2. Staff can manage products/stock and move orders through fulfilment in the portal UI.
3. All response shapes match `schemas` in `admin-api-contract.json`.
4. Demo tracking order `RK-73262` resolves via `GET /orders/track/RK-73262` after seeding.

## Repos

- Storefront (read-only reference): `raj-front`
- Portal (new repo): e.g. `raj-portal` or `raj-admin`

Start by scaffolding the portal app, database schema from the contract schemas, seed script from `seedData`, then Phase 1 API routes, then admin UI for catalog and orders.
