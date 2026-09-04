# Raj Kollections — Storefront API integration guide

Hand this doc to the **raj-front** team. It describes how to call the portal API that powers catalog, auth, checkout, and customer account features.

**Full machine-readable contract:** [`admin-api-contract.json`](./admin-api-contract.json) (schemas, seed data, business rules).

---

## Base URL

| | |
|---|---|
| **Production API** | `https://portal.rajkollections.com` |
| **Storefront env var** | `NEXT_PUBLIC_API_URL` |
| **Example catalog call** | `https://portal.rajkollections.com/catalog/products` |

Set this in the storefront `.env.local` (no trailing slash):

```bash
NEXT_PUBLIC_API_URL=https://portal.rajkollections.com
```

All endpoint paths in this doc are appended to that origin. Local dev against a local portal is optional — override the env var to `http://localhost:3000` (or whatever port the portal runs on).

---

## Quick start

```bash
# .env.local on the storefront (raj-front)
NEXT_PUBLIC_API_URL=https://portal.rajkollections.com
```

```ts
/** Production default — override via NEXT_PUBLIC_API_URL in .env */
const API =
  process.env.NEXT_PUBLIC_API_URL ?? "https://portal.rajkollections.com";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    credentials: "include", // required for auth cookie
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
```

### CORS

The portal allows browser requests from:

- `https://www.rajkollections.com`
- `http://localhost:3000` / `http://127.0.0.1:3000` (local dev)

All cross-origin calls must use `credentials: "include"`. If you add a staging domain, ask the portal team to add it to the allowlist.

### Errors

Failed requests return JSON:

```json
{ "error": "Human-readable message" }
```

Status codes: `400` validation, `401` not signed in, `404` not found, `500` server error.

---

## URL map

The portal exposes **clean paths** (no `/api` prefix). Internally these rewrite to route handlers — use the paths in the left column.

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/catalog/departments` | — | All departments (flat array, tree via `parentId`) |
| `GET` | `/catalog/departments/:slug` | — | Single department |
| `GET` | `/catalog/products` | — | Product list (see query params below) |
| `GET` | `/catalog/products/:slug` | — | Product detail |
| `GET` | `/catalog/products/id/:id` | — | Product by external id |
| `GET` | `/catalog/products/:slug/related?limit=4` | — | Related products |
| `GET` | `/catalog/search?q=…&limit=6` | — | Search suggestions |
| `POST` | `/orders` | optional | Place order + start MoMo payment |
| `GET` | `/orders` | session | Customer's order history |
| `GET` | `/orders/:id` | session | Single order (public order number) |
| `GET` | `/orders/track/:trackingNumber` | — | Public tracking (`RK-73262`) |
| `POST` | `/auth/request-code` | — | Send OTP SMS |
| `POST` | `/auth/verify-code` | — | Verify OTP, create session |
| `POST` | `/auth/complete-profile` | session | Set name after first login |
| `POST` | `/auth/logout` | session | Clear session |
| `GET` | `/customer/me` | session | Current customer |
| `PATCH` | `/customer/me` | session | Update profile fields (birthday, email) |
| `POST` | `/customer/email/resend` | session | Resend email confirmation link |
| `POST` | `/auth/verify-email` | token | Confirm email from inbox link |
| `GET/POST` | `/customer/addresses` | session | List / create addresses |
| `PATCH/DELETE` | `/customer/addresses/:id` | session | Update / delete address |
| `GET/PUT/POST` | `/customer/saved` | session | Saved items (wishlist) |
| `DELETE` | `/customer/saved/:productId?variantId=` | session | Remove saved item |

**Auth legend**

- **—** = no login required
- **session** = `rk_customer_session` HttpOnly cookie (set by `/auth/verify-code`)
- **token** = one-time email confirmation token in the JSON body (no session)
- **optional** = works logged in or as guest; logged-in orders link to the account

---

## Catalog

### Departments

```http
GET /catalog/departments
```

```ts
interface Department {
  id: string;           // e.g. "dep-pantry"
  slug: string;         // e.g. "pantry"
  name: string;
  parentId: string | null;
  sortOrder: number;
  image: string;        // absolute URL when fetched cross-origin
  description: string;
}
```

Navigation: top-level items have `parentId: null`. Sub-departments point at the parent's `id`.

### Products

```http
GET /catalog/products
GET /catalog/products?department=rice-grains
GET /catalog/products?sale=1
GET /catalog/products?stock=1
GET /catalog/products?sort=newest
GET /catalog/products?q=rice
```

| Query | Values | Notes |
|-------|--------|-------|
| `department` | slug | Includes products in that department **and all child sub-departments** |
| `sale` | `1` | `compareAtPrice > price` |
| `stock` | `1` | `inStock === true` |
| `sort` | `featured` \| `newest` \| `popularity` \| `price-asc` \| `price-desc` | Default: `featured` |
| `q` | string | Search |
| `min` / `max` | number | Price filter |

**Important:** call `GET /catalog/products` with **no query params** on app load. The response powers the mega menu (on sale, new arrivals, department counts). Cache ~60s on server components:

```ts
const products = await fetch(`${API}/catalog/products`, {
  next: { revalidate: 60 },
});
```

```ts
interface ProductListResult {
  items: Product[];
  total: number;
  bounds: { min: number; max: number };
}

interface Product {
  id: string;
  slug: string;
  name: string;
  departmentId: string;
  brand?: string;
  description: string;
  imageUrls: string[];
  price: number;
  compareAtPrice?: number;
  inStock: boolean;
  createdAt: string;       // "YYYY-MM-DD"
  popularity?: number;
  attributes: Record<string, string>;
  variants?: ProductVariant[];
  tags?: ("sale" | "new")[];
  keywords?: string[];
}

interface ProductVariant {
  id: string;
  sku: string;
  attributes: Record<string, string>;  // e.g. { Weight: "5kg" }
  price: number;
  compareAtPrice?: number;
  stock: number;
  imageUrls?: string[];
}
```

### Badges (client-side, no extra API)

- **Sale:** `compareAtPrice > price` (or tag `sale`)
- **New:** `tags` includes `"new"`
- **Out of stock:** `inStock === false` (also check variant `stock` on PDP)

### What is NOT a separate endpoint

- No `/catalog/new-arrivals` → use `?sort=newest`
- No `/catalog/on-sale` → use `?sale=1`
- No `/collections` → departments only
- Mega menu is built client-side from full product list + departments

---

## Auth & account creation

Phone OTP flow. **First-time users are created automatically** on successful verify — there is no separate sign-up endpoint.

Phones are stored as Ghana format: `233XXXXXXXXX` (no `+`). Normalize before sending:

```ts
function normalizePhone(input: string): string {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `233${digits.slice(1)}`;
  if (!digits.startsWith("233")) digits = `233${digits}`;
  return digits;
}
```

### 1. Request code

```http
POST /auth/request-code
Content-Type: application/json

{
  "phone": "233241234567",
  "profile": { "name": "Ama Mensah" }   // optional — pre-save name
}
```

Response: `{ "ok": true }`

Hubtel sends the SMS when configured; in dev the code is logged on the portal server.

### 2. Verify code

```http
POST /auth/verify-code

{ "phone": "233241234567", "code": "123456" }
```

Response sets cookie `rk_customer_session` (HttpOnly, 30 days, `SameSite=Lax`).

```ts
interface VerifyResponse {
  ok: true;
  needsProfile?: true;   // present when name is empty — show name form
  customer?: Customer;   // present when profile is complete
}

interface Customer {
  id: string;    // external id, e.g. "cust-abc123"
  name: string;
  phone: string;
  email?: string;          // verified only
  pendingEmail?: string;   // submitted, awaiting confirmation
  dateOfBirth?: string;    // "YYYY-MM-DD"
}
```

### 3. Complete profile (if `needsProfile`)

```http
POST /auth/complete-profile

{ "name": "Ama Mensah" }
```

Response: `{ "customer": Customer }`

### 4. Session check

```http
GET /customer/me
```

Returns `Customer` or `401` if not signed in.

### 5. Logout

```http
POST /auth/logout
```

Returns `204`, clears cookie.

---

## Customer profile (birthday and email)

**Do not collect these at sign-up.** Phone OTP + name stays the create-account flow. The storefront collects birthday and email on **Your details** (`/account/profile`) after the account exists.

An account with only `name` + `phone` is complete. Birthday and email can be added later.

### Customer shape (extended)

Every `Customer` payload (`GET /customer/me`, auth responses, `PATCH /customer/me`) should include:

```ts
interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;          // verified address only; omit if none
  pendingEmail?: string;   // last submitted address, awaiting the inbox link
  dateOfBirth?: string;    // "YYYY-MM-DD"; omit if unset
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `email` | no | **Verified only.** Never put an unconfirmed address here. Used for order-update mail. |
| `pendingEmail` | no | Set while a confirmation is outstanding. Clear on success or if they drop the address. |
| `dateOfBirth` | no | Calendar date, no time, no timezone. Store as `date`, not `timestamptz`. |

Changing email does **not** replace `email` until they click the link. Keep the old verified address live until then.

Checkout `POST /orders` still has its own `customer.email` on the order snapshot. That is contact for that order. Do **not** copy checkout email onto the account, and do **not** start verification from checkout.

### Update profile

```http
PATCH /customer/me
Content-Type: application/json

{
  "dateOfBirth": "1998-09-04",
  "email": "ama@example.com"
}
```

Session required. All fields optional; omitted keys mean “leave as-is”. Send JSON `null` to clear.

```ts
interface ProfileUpdate {
  dateOfBirth?: string | null;  // "YYYY-MM-DD", or null to clear
  email?: string | null;        // start confirmation, or null to clear both email + pendingEmail
}
```

Response `200`: `{ ...Customer }` (the updated customer, same shape as `GET /customer/me`).

**`dateOfBirth`**

- Format: `YYYY-MM-DD` only.
- Must be a real calendar date, not in the future, year ≥ 1900.
- Store the date as given. Do not convert through UTC (that shifts the day).
- `null` clears it.
- Invalid date → `400` `{ "error": "Enter a real date of birth." }`
- Portal may later use month+day for birthday offers. Storefront does not apply discounts from this field.

**`email`**

- Trim, lowercase, max 254 chars, must look like an email.
- `null` clears `email` and `pendingEmail`, and invalidates unused confirmation tokens.
- If it matches the current verified `email`, clear `pendingEmail` and do not send mail.
- If it matches current `pendingEmail`, do **not** send another mail (use resend for that).
- Otherwise treat it as a new address:
  1. If another customer already has this **verified** `email` → `409` `{ "error": "That email is already on another account." }`
  2. Set `pendingEmail` to the new address. Leave existing `email` as-is.
  3. Invalidate previous tokens for this customer.
  4. Create a single-use token (32+ random bytes, **hash at rest**, TTL **24 hours**).
  5. Send the confirmation mail (see below).
- Response still `200` with `pendingEmail` set. Do not wait for the click.

**Name / phone:** not updated here. Phone is the login identity.

### Resend confirmation

```http
POST /customer/email/resend
```

Session required. No body.

- No `pendingEmail` → `400` `{ "error": "Add an email first, then we'll send a confirmation link." }`
- Rate limit: **3 sends per customer per hour**, **3 per email address per hour**. Over limit → `429`.
- Issues a new token, invalidates the old one, sends again.
- Response `200`: updated `Customer`.

### Confirmation mail

From a store address (`hello@rajkollections.com` or similar). Customer-facing, not a portal URL.

**Link the storefront, not the admin host:**

```
https://www.rajkollections.com/verify-email?token={rawToken}
```

Local / staging: use that storefront origin. Query param name is `token`.

Suggested subject: `Confirm your email`. Body: short, the link, “this expires in 24 hours”. Do not mention Hubtel, the portal, or OTP.

Only send this mail after they save an email on **Your details**. Never from sign-up.

### Confirm the link

```http
POST /auth/verify-email
Content-Type: application/json

{ "token": "…" }
```

**No session required.** The token is the credential. Works if they open the mail on a different device.

| Outcome | Status | Body |
|---------|--------|------|
| Valid token | `200` | `{ "ok": true, "customer"?: Customer }` |
| Missing/unknown/used token | `400` | `{ "error": "That confirmation link is no longer valid." }` |
| Expired | `400` | `{ "error": "That link has expired. Request a new one from your account." }` |
| Email now verified on another account | `409` | `{ "error": "That email is already on another account." }` |

On success:

1. Set `email` to the pending address, clear `pendingEmail`.
2. Mark token used (single use).
3. Include `customer` **only** if the request also has that customer’s session cookie. Otherwise `{ "ok": true }` with no customer (do not leak the profile).

Storefront page: `GET /verify-email?token=` → `POST /auth/verify-email`.

### Suggested columns

```text
customers.date_of_birth     date            null
customers.email             text            null, unique where not null
customers.email_verified_at timestamptz     null
customers.pending_email     text            null

email_confirmation_tokens
  id, customer_id, email, token_hash, expires_at, used_at, created_at
```

`Customer.email` in the API is populated only when `email_verified_at` is set. Until then expose `pendingEmail`.

### What the storefront already does

- Sign-up / sign-in unchanged (phone + name).
- `/account/profile` — date picker + email (collected after sign-up, not at registration).
- `/verify-email?token=` — public page, calls `POST /auth/verify-email`.
- Local demo (no `NEXT_PUBLIC_API_URL`) confirms via an on-page link.

---

## Checkout & orders

### Shipping (compute client-side, API re-validates)

| Rule | Value |
|------|-------|
| Flat rate | GHS 25 |
| Free shipping | subtotal ≥ GHS 350 |
| Currency | GHS |

```ts
function computeShipping(subtotal: number): number {
  return subtotal >= 350 ? 0 : 25;
}
```

If subtotal/shipping/total don't match server calculation, `POST /orders` returns `400`.

### Place order

```http
POST /orders
```

```ts
interface CreateOrderRequest {
  customerId?: string;   // optional — session links order automatically
  customer: {
    name: string;
    phone: string;       // 233XXXXXXXXX
    email: string;
    region: string;
    city: string;
    address: string;
    mapsUrl?: string;
    notes?: string;
  };
  lines: {
    productId: string;   // product external id, e.g. "p-001"
    variantId?: string;  // required when product has variants
    slug: string;
    quantity: number;
    name: string;
    price: number;       // unit price at time of add-to-cart
    imageUrl: string;
    attributes?: Record<string, string>;
  }[];
  subtotal: number;
  shipping: number;
  total: number;
}
```

**Example**

```json
{
  "customer": {
    "name": "Ama Mensah",
    "phone": "233241234567",
    "email": "ama@example.com",
    "region": "Greater Accra",
    "city": "Accra",
    "address": "14 Boundary Road, East Legon",
    "mapsUrl": "https://maps.app.goo.gl/example",
    "notes": "Call on arrival"
  },
  "lines": [
    {
      "productId": "p-001",
      "variantId": "v-001-5",
      "slug": "golden-basmati-rice",
      "quantity": 1,
      "name": "Golden Basmati Rice",
      "price": 189,
      "imageUrl": "/images/products/golden-basmati-rice-1.jpg",
      "attributes": { "Weight": "5kg" }
    }
  ],
  "subtotal": 189,
  "shipping": 25,
  "total": 214
}
```

**Response `201`**

```ts
interface CreateOrderResponse {
  reference: string;
  orderId: string;              // public order number, e.g. "1043"
  trackingNumber: string;       // e.g. "RK-1043"
  paymentReference?: string;
  paymentStatus: "pending" | "paid" | "demo";
  paymentMessage?: string;
}
```

| `paymentStatus` | Meaning |
|-----------------|--------|
| `pending` | Order saved; MoMo USSD prompt sent — customer should approve on phone |
| `paid` | Payment confirmed immediately (rare) |
| `demo` | Hubtel not configured on portal — order saved as unpaid for testing |

**UX:** show `paymentMessage` and `trackingNumber` on the confirmation screen. Poll `GET /orders/:orderId` or `GET /orders/track/:trackingNumber` if you need to reflect payment status after the customer approves MoMo.

The storefront **never calls Hubtel directly**. Payment is initiated server-side on order creation; Hubtel callbacks update `payment_status` on the portal.

### Order history (signed in)

```http
GET /orders
GET /orders/1043
```

```ts
interface Order {
  id: string;
  trackingNumber?: string;
  invoiceNumber?: string;
  paymentReference?: string;
  placedAt: string;
  status: "processing" | "packed" | "on_the_way" | "delivered" | "cancelled";
  deliveryDate: string;
  address: { name: string; line: string; city?: string; region: string };
  rider?: { name: string };
  shipping: number;
  subtotal: number;
  total: number;
  lines: {
    productId: string;
    slug: string;
    name: string;
    imageUrl: string;
    quantity: number;
    unitPrice: number;
    attributes: Record<string, string>;
  }[];
}
```

### Public tracking

```http
GET /orders/track/RK-73262
```

No auth. Demo order `RK-73262` exists for QA.

---

## Customer addresses & saved items

### Addresses

```ts
interface AddressInput {
  label: string;
  name: string;
  phone: string;
  region: string;
  city: string;
  line: string;
  mapsUrl?: string;
  isDefault?: boolean;
}

interface CustomerAddress extends AddressInput {
  id: string;
  isDefault: boolean;
}
```

- `GET /customer/addresses` → `CustomerAddress[]`
- `POST /customer/addresses` → `CustomerAddress`
- `PATCH /customer/addresses/:id` → partial `AddressInput`
- `DELETE /customer/addresses/:id` → `204`

### Saved items (wishlist)

```ts
interface SavedItem {
  productId: string;
  variantId?: string;
  snapshot: {
    slug: string;
    name: string;
    price: number;
    compareAtPrice?: number;
    imageUrl: string;
    optionLabel?: string;
  };
  savedAt: string;
}
```

- `GET /customer/saved` → `SavedItem[]`
- `PUT /customer/saved` → replace full list
- `POST /customer/saved` → add one
- `DELETE /customer/saved/:productId?variantId=` → `204`

---

## Recommended wiring checklist

### Already expected on storefront (wire to live API)

- [ ] `NEXT_PUBLIC_API_URL` points at portal
- [ ] Shared `api()` helper with `credentials: "include"`
- [ ] Catalog: departments, product list, PDP, search, related
- [ ] Checkout: `POST /orders` with shipping validation
- [ ] Track page: `GET /orders/track/:trackingNumber`

### Wire next (HTTP client may exist — connect it)

- [ ] Auth: request-code → verify-code → complete-profile
- [ ] Account: `/customer/me`, `PATCH /customer/me`, addresses CRUD
- [ ] Email confirmation: `POST /customer/email/resend`, `POST /auth/verify-email`
- [ ] Saved items sync

### Stay local (no API)

- Cart state (localStorage / context until checkout)

### Not implemented

- Contact form, newsletter endpoints

---

## End-to-end test flow

1. `GET /catalog/products` — confirm 28 products (after portal seed).
2. `GET /catalog/products/golden-basmati-rice` — confirm variants.
3. `POST /auth/request-code` with your phone → enter OTP from SMS (or portal logs in dev).
4. `POST /auth/verify-code` → confirm `Set-Cookie: rk_customer_session`.
5. `POST /orders` with one line → confirm `trackingNumber` in response.
6. Open portal `/orders` — order appears with **Website** badge and customer details.

---

## Environments

| Environment | Storefront | API (`NEXT_PUBLIC_API_URL`) |
|-------------|------------|------------------------------|
| Local | `http://localhost:3000` | `http://localhost:3000` (same Next app) or deployed portal |
| Production | `https://www.rajkollections.com` | `https://portal.rajkollections.com` |

For local storefront → local portal, both on port 3000 only works if you run one app. Typically: storefront on `:3000`, portal on `:3001` — add `http://localhost:3001` to CORS if needed.

---

## Questions / changes

- **New CORS origin** (staging): portal team adds to `lib/api/cors.ts`
- **Schema changes:** update `docs/admin-api-contract.json` and this guide together
- **Payment issues:** quote `paymentReference` / `trackingNumber` to support
