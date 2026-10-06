# CLAUDE MASTER PROMPT — KEDAI KARUHUN

You are a senior full-stack engineer, product designer, security engineer, and QA engineer.

Build and maintain the Kedai Karuhun Commerce PWA described in `docs/PRD_KEDAI_KARUHUN.md`.

The application is a REAL production application, not a demo/testing application.

DO NOT add mock checkout, fake orders, test-only menus, simulation buttons, or fake revenue/customer statistics.

When features are not configured (for example VAPID or payment gateway credentials), show a clear setup state rather than pretending the feature is active.

## BRAND
Brand: Kedai Karuhun.
Use the real logo from `public/branding/logo.*` when supplied by the owner. Until the owner supplies it, provide a clearly isolated logo placeholder that can be replaced without code changes.

## UX
Mobile-first and accessible to all ages.
Use Indonesian language.
Prefer plain labels:
- Belanja
- Kategori
- Keranjang
- Pesanan
- Akun
- Bayar
- Simpan alamat
- Beli sekarang
- Tambah
- Hapus

Do not use excessive English product/UI labels.

Visual style:
- fresh green
- warm white
- deep charcoal text
- restrained borders
- moderate 10–16px radius
- very limited gradients
- no generic AI SaaS look
- no neon
- no glassmorphism overload
- no huge empty hero sections

Mobile navigation must use bottom navigation.
Customer primary actions must have large touch targets.
Minimum recommended target ~44px.

## ARCHITECTURE
Public website + customer app + admin portal.

Public:
/
/products
/products/[slug]
/kategori/[slug]
/cart
/checkout
/login
/orders
/orders/[id]
/account

Admin:
/admin
/admin/orders
/admin/orders/[id]
/admin/products
/admin/products/new
/admin/products/[id]
/admin/inventory
/admin/finance
/admin/users
/admin/categories
/admin/settings

API:
/api/orders
/api/orders/[id]/proof
/api/push/subscribe
/api/admin/products
/api/admin/orders
/api/admin/finance
/api/admin/users
/api/admin/categories
/api/admin/settings

## AUTH
Use Supabase Auth with cookie-based SSR using `@supabase/ssr`.

Customer authentication can use email magic link for MVP.
Do not ask user to login on every navigation.
The session must persist.
Guest users can browse products and add to cart locally.
Require authentication when creating an order or viewing account/order history.

## DATABASE
Use Supabase PostgreSQL.
Enable RLS on all exposed tables.
Keep service role key server-only.

Tables:
profiles
categories
products
delivery_zones
customer_addresses
orders
order_items
inventory_movements
financial_transactions
push_subscriptions
notifications
store_settings

Use foreign keys and indexes.
Use order item snapshots for product name/unit/price so historical orders remain correct after product edits.

## ORDER CREATION
Use a Postgres RPC or transactional database function for order creation.
Validate:
- current user
- active delivery zone
- active products
- positive quantities
- sufficient stock
- minimum order amount

Lock product rows during stock check/update.
Create order + items + stock movement atomically.

Never trust client-calculated totals.
The server/database must calculate the subtotal, delivery fee, and total from current database values.

## PAYMENT
Support:
- QRIS
- bank transfer
- COD

QRIS and transfer are manual verification for MVP:
- show official store instruction
- customer uploads payment proof
- admin verifies payment

Payment abstraction should make it easy to add a real payment gateway later.

Never claim a payment is successful just because the customer pressed a button.

## ORDER STATUSES
new
confirmed
processing
ready
delivering
completed
cancelled

Payment statuses:
pending
proof_uploaded
verified
failed
cod

## STOCK
Stock can be numeric because products may use kg/liter/pcs.
Admin can adjust stock.
Every adjustment creates inventory movement.
Sales reduce stock atomically.

## ADMIN
Admin is operationally important.
Dashboard must be simple and fast.
Prioritize new orders.

Dashboard widgets:
- orders waiting
- payment proofs waiting
- products low stock
- today's sales
- today's expenses
- net cashflow

Admin should not be forced through deep navigation to do common tasks.

## PRODUCT MANAGEMENT
Admin can:
- create/edit product
- upload real product image
- set price
- set unit
- set stock
- set category
- feature/unfeature
- activate/deactivate

Use Supabase Storage for product images.
Use image validation (type and max size).

## USER MANAGEMENT
Roles:
customer
staff
manager
admin

Only manager/admin can manage roles/settings/finance.
Staff can process orders and stock.
Admin access must be checked server-side.

## NOTIFICATIONS
Implement:
1. in-app notification records
2. Web Push support via service worker + VAPID

When a new order is created:
- insert notification
- send push to staff/admin push subscriptions if configured

When a customer uploads payment proof:
- insert notification
- send push if configured

Do not implement unofficial WhatsApp automation.
Provide a manual WhatsApp deep link for customer contact when helpful.

## PWA
Use:
- app/manifest.ts
- public/sw.js
- install prompt when browser provides one
- standalone display
- green theme
- safe-area support

## CUSTOMER UX
Home:
- logo
- search
- categories
- popular/featured products
- concise benefits

Product listing:
- category chips
- search
- product cards
- price
- unit
- stock state
- add button

Cart:
- edit quantity
- remove item
- subtotal
- checkout CTA

Checkout:
- recipient name
- phone
- address
- delivery area
- payment method
- notes
- total

Avoid multiple pages for simple checkout.

## CUSTOMER ACCOUNT
Show:
- profile
- default/saved address
- order history
- order detail
- logout

## ERROR HANDLING
Never show raw Supabase error messages to users.
Map errors to simple Indonesian copy.

Never show blank pages.
Implement loading, empty, error, unauthorized states.

## PERFORMANCE
Avoid unnecessary data fetching.
Use server-side fetching for public data.
Parallelize independent queries.
Use client-side localStorage for cart.
Use appropriate loading UI.

## SECURITY
- RLS everywhere
- service role only server side
- validate admin role server-side
- validate payloads with Zod
- do not trust browser totals
- do not expose private payment proof URLs
- do not log secrets
- sanitize user-supplied copy before rendering if necessary
- set strict file size/type validation
- consider rate limiting for auth/order/proof endpoints in production

## FILES / DOCUMENTATION
Keep:
- docs/PRD_KEDAI_KARUHUN.md
- docs/SETUP.md
- docs/DEPLOYMENT.md
- docs/PAYMENT_FLOW.md
- docs/CLAUDE_BUILD_PROMPT.md

## DEFINITION OF DONE
Run:
npm run typecheck
npm run lint
npm run build

Fix errors before declaring complete.

Then provide:
1. files changed
2. migrations to run
3. env vars
4. Supabase setup
5. storage setup
6. VAPID setup
7. local run instructions
8. Vercel deployment instructions
9. manual payment setup
10. known limitations

Do not stop at UI mockups. Implement the backend, database, auth, order processing, stock, finance, admin, PWA, and notification flows.
