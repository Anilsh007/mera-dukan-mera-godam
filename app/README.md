# App Structure

This app keeps reusable code outside feature routes and feature-specific code close to its route.

## Shared folders

- `components/ui`: reusable UI primitives such as buttons, inputs, tables, receipts, and summary cards.
- `components/layout`: dashboard shell pieces such as the header and sidebar.
- `components/auth`: authentication screens and route guards.
- `components/inventory`: reusable inventory UI helpers shared by quick purchase, purchases, and stock flows.
- `components/theme`: theme provider and theme toggle.
- `hooks`: shared data hooks used by multiple dashboard pages.
- `lib`: database, auth identity helpers, sync services, domain utilities, and app-wide services.
- `api`: server routes and API-only helpers.

## Feature folders

Feature route folders stay under `dashboard`:

- `Quick-purchase`: Quick Purchase route and form.
- `purchases`: purchase ledger services, constants, utilities, and page.
- `suppliers`: supplier ledger page and supplier payment UI.
- `all-inventory`: stock list, details, stock in/out, sales, and stock history components.
- `gst-invoice`: GST invoice builder and invoice-specific helpers.
- `profile`: profile editor/showcase.
- `reports`, `expiry-alerts`, `stock-history`, `settings`: route-specific pages and helpers.

## Rule of thumb

If code is used by more than one feature, move it into `components`, `hooks`, or `lib`.
If code belongs to one business workflow only, keep it inside that feature folder.
