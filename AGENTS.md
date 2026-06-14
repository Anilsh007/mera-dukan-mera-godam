# AGENTS.md - Dugam Project Rules

These durable rules apply to all current and future phases of the **Dugam** project.

Project type: Next.js / React / TypeScript stock inventory management, GST billing, purchase/sale, reports, print/receipt web app for Indian small shopkeepers and low-technical users.

## Project Identity

1. This project is **Dugam / MDMG**.
2. It is a Next.js / React / TypeScript inventory, GST billing, purchase, sale, reports, print/receipt web app for Indian small shopkeepers and low-technical users.
3. Keep one permanent rule system in this root `AGENTS.md` so future phases do not need duplicated rule prompts.
4. Treat `docs/MDMG_PHASE_ROADMAP.md` and `docs/PHASE_STATUS.md` as the durable phase planning/status sources for future work.

## Common Project Rules

5. First inspect existing code before making changes.
6. Do not blindly rewrite the full app.
7. Preserve existing working features.
8. Make small, safe, incremental changes.
9. Do not remove features unless they are broken and replaced with a better working implementation.
10. Do not modify `.env`, `.env.local`, secrets, API keys, private credentials, Firebase keys, Supabase keys, or payment keys.
11. Keep code TypeScript-safe, clean, scalable, and maintainable.
12. Avoid `any` unless absolutely necessary.
13. Keep business logic in reusable utilities, hooks, and services.
14. Avoid duplicate logic.
15. Remove dead code only when safe.
16. Do not implement fake production integrations for official portals or paid providers.

## Text / Localization Rules

17. Keep all user-facing text in `en.ts` or the existing language/text constants system.
18. Do not hardcode visible labels, messages, placeholders, table headings, modal text, invoice text, receipt text, GST text, validation text, SEO text, toast text, share text, headings, or helper text directly inside components.
19. All button labels, form labels, placeholders, helper text, validation messages, success messages, error messages, warnings, empty states, modal titles, modal descriptions, table headings, filter labels, sorting labels, invoice labels, receipt labels, GST labels, profile labels, report labels, navigation labels, SEO text, toast messages, and share messages must come from `en.ts`.
20. Organize `en.ts` by modules such as `common`, `navigation`, `dashboard`, `inventory`, `quickPurchase`, `purchases`, `gstInvoice`, `profile`, `reports`, `suppliers`, `validation`, `modals`, `receipt`, `print`, `share`, `seo`, `errors`, `success`, `warnings`, `emptyStates`, and `toast`.
21. Future translation should be easy.

## Reusable Component Rules

22. Prefer reusable components from `app/components/ui`.
23. Do not duplicate Button, Input, Table, Modal, Receipt, Print, GST, Share, Toast, Validation, Card, or Badge logic.
24. Improve shared components instead of writing repeated UI inside pages.
25. Use consistent UI patterns for buttons, inputs, tables, cards, badges, modals, forms, empty states, loading states, error states, and success states.
26. Existing reusable components should be improved and reused wherever possible.

## Modal / Popup Rules

27. Use one common reusable Modal/Dialog component wherever possible.
28. All popups/modals should have consistent layout, title, description, content area, footer actions, cancel button, primary action button, loading state, error state, close button, ESC close, responsive layout, and accessibility.
29. Destructive actions must require confirmation.
30. Modals must work properly on mobile, tablet, and desktop.
31. Modal text must come from `en.ts`.

## Toast / Notification Rules

32. Every important user action must show toast/notification feedback.
33. No action should fail silently.
28. Toast must appear for loading, success, error, warning, info, validation, confirmation, print, share, download, export, GST invoice, purchase, sale, stock add, stock edit, stock delete, product edit, product delete, profile update, report export, local DB error, network error, and sync error where applicable.
29. Toast feedback is required for:
    - quick purchase
    - detailed purchase
    - add stock
    - sale stock
    - multi item sale
    - product edit
    - product delete
    - GST invoice create
    - GST invoice preview
    - GST invoice print
    - GST invoice download
    - GST invoice share
    - receipt print
    - receipt download
    - receipt share
    - profile update
    - report export
    - validation failure
    - local DB/network/sync failure
36. Create or improve one reusable toast/notification system.
30a. Mount the toast container once globally in the root app layout inside a client-capable provider so it persists across navigation.
30b. Keep toast UI above modals, drawers, tables, and dashboard content, and avoid DOM rewriting or translation passes mutating toast container nodes.
37. Do not use random browser alert messages unless absolutely necessary.
38. Toast messages must be simple and user-friendly.
39. Technical errors can be logged safely, but the user should see simple helpful messages.
40. All toast text must come from `en.ts`.

## Share System Rules

41. Important transaction details should be shareable anytime from relevant screens.
36. User should be able to share purchase, stock add, stock sale, multi item sale, GST invoice, receipt, supplier payment, transaction history, and reports where useful.
37. Share options should include where suitable:
    - WhatsApp
    - Email
    - Native mobile share
    - Copy details
    - Print
    - Download PDF/receipt/invoice where supported
38. If direct sending is not possible without an external provider/API, safely open WhatsApp/email compose with prefilled details.
39. Use `navigator.share` on supported mobile browsers where suitable.
40. Provide copy-to-clipboard fallback.
41. If sharing succeeds, opens compose, fails, or has missing data, show proper toast.
42. Do not duplicate share logic separately in every page.
43. Create reusable share utilities/components such as `ShareActions`, `ShareButton`, `TransactionShareMenu`, `buildShareMessage`, `openWhatsAppShare`, `openEmailShare`, `nativeShare`, and `copyToClipboard` where suitable.
44. Sharing should reuse the common transaction/receipt/invoice data format.
45. Shared messages should include useful details such as business name, transaction type, invoice/receipt number, date/time, customer/supplier name, item details, quantity, rate, GST amount if applicable, total amount, payment status, due amount, and footer note.
52. All share labels/messages must come from `en.ts`.

## Print / Receipt / Invoice Rules

53. Print, receipt, and invoice should use one reusable component wherever possible.
48. Do not create separate print components for every page if one reusable component can handle the job.
49. Common print/receipt/invoice component should support:
    - Quick Purchase receipt
    - Detailed Purchase receipt
    - Add Stock receipt
    - Sale Stock receipt
    - Multi Item Sale receipt
    - GST Invoice
    - Stock Adjustment receipt
    - Supplier Payment receipt where available
50. Print component must use profile/business details automatically.
51. Print output should be clean, professional, A4-friendly, responsive in preview, and readable.
52. Print data should also be usable for share, download, WhatsApp, email, and copy actions.
59. Print/receipt/invoice labels must come from `en.ts`.

## GST Rules

60. GST calculation must be reusable and reliable.
61. Do not duplicate GST calculation logic in multiple pages.
62. GST should be implemented wherever required: sale, purchase, quick purchase, detailed purchase, multi item sale, GST invoice, receipt, print, and reports where applicable.
63. GST utilities should handle taxable amount, GST percentage, CGST, SGST, IGST, total GST, grand total, and GSTIN validation.
64. If seller and buyer are in the same state, use CGST + SGST where state data is available.
65. If seller and buyer are in different states, use IGST where state data is available.
66. If state data is unavailable, use a safe fallback and show clear UI.
67. GST invoice should use business profile details.
68. GST invoice generation should warn user if required profile/GST details are missing.
69. Invoice totals must always match item totals.
70. Do not fake official GST portal, e-invoice, or e-way bill integration.
71. GST labels/messages must come from `en.ts`.

## Inventory / Business Logic Rules

72. Purchase must increase stock correctly.
73. Add stock must increase stock correctly.
74. Sale stock must decrease stock correctly.
75. Multi item sale must update all selected products correctly.
76. Stock should not go negative unless explicitly allowed.
77. Product edit must not corrupt stock history.
77a. Do not directly overwrite current stock inside edit forms unless the change is routed through a safe adjustment/history flow.
78. Product delete must require confirmation.
79. Low stock, critical stock, and out of stock status must calculate correctly.
80. Search, filter, and sorting must work correctly.
81. Every stock-changing action should create a transaction/history record where possible.
82. Transaction history should track transaction type, product/items, old stock, new stock, quantity changed, date/time, amount, GST details, payment mode/status, customer/supplier reference, receipt/invoice number, and notes where possible.

## Business Model Rules

83. Logged-in user is the shop owner or business owner.
84. In purchase flows, the logged-in business is the buyer.
85. In sale flows, the logged-in business is the seller.
86. Customers/buyers and suppliers are records inside the business.
87. The same party can be a customer, supplier, or both.
88. Do not create separate buyer-login or seller-login flows at this stage.

## Profile Integration Rules

89. Profile details must be used in GST invoices and receipts.
90. Profile details should include or support business name, owner name, logo, address, city, state, pincode, mobile, email, GSTIN, business type, terms and conditions, and bank/UPI/payment details where available.
91. If profile is incomplete, show clear warning and guide user to profile page.
92. Do not allow proper GST invoice generation if required GST/profile details are missing unless user confirms simple receipt/non-GST flow.

## Subscription Model Rules

93. Every new user gets a 90-day Limited Pro Trial.
94. During the first 90 days, major services may be available with defined limits.
95. After 90 days, subscription is required for create/update premium business actions.
96. Never delete, hide, or silently purge user data after trial expiry.
97. Expired users can view old data and use safe basic export where appropriate.
98. Expired users cannot create or update premium data until subscribed.
99. Do not integrate a live payment gateway yet.
100. Do not add real Razorpay, Cashfree, Stripe, or other payment keys.
101. Add only safe payment provider placeholders/interfaces for future integration.

### Plan Structure

102. Supported plan identifiers:
   - `trial`
   - `free/expired-readonly`
   - `starter`
   - `pro`
   - `business`

### Subscription Statuses

103. Supported subscription statuses:
   - `trialing`
   - `active`
   - `expired`
   - `cancelled`
   - `manual`

### Trial Limits

104. Trial plan limits:
   - products: 500
   - quick sales/sales: 300 per month
   - purchases: 300 per month
   - GST invoices: 100 per month
   - customers: 100
   - suppliers: 50
   - exports: 20 per month
   - businesses: 1
   - staff users: 1
   - godowns: 1
   - barcode scanner: enabled
   - reports: enabled
   - print/share/download: enabled

## Responsive Design Rules

105. App must be fully responsive across small mobile, large mobile, tablet, laptop, desktop, and wide screens.
106. No horizontal overflow on mobile.
107. Tables should become horizontally scrollable or card-based on mobile.
108. Buttons must not overlap.
109. Inputs must not overflow.
110. Modals must fit mobile screen.
111. Forms should become single-column on mobile.
112. Dashboard navigation should be mobile-friendly.
113. Touch targets must be easy to tap.
114. Font sizes must be readable.
115. All functionality must work on every device.
116. Print preview must remain clean and usable.

## UI / Dark Mode / 3D Depth Rules

117. UI should support both light and dark mode.
117a. Dark mode must remain high-contrast, professional, comfortable, and visually positive. Avoid dull, muddy, overly black, or depressing color palettes.
118. Use subtle professional 3D/depth UI only.
119. Do not use heavy 3D libraries unless absolutely necessary.
120. Performance and usability are more important than decoration.
121. Use soft shadows, layered cards, slight gradients, hover lift, pressed button states, and premium SaaS-style surfaces where suitable.
122. Respect `prefers-reduced-motion`.
123. Avoid childish, heavy, or over-animated UI.
124. Keep UI simple for shopkeepers and low-technical users.

## Performance Rules

125. Website should be fast on low-end mobile devices.
126. Optimize search, filter, and sort.
127. Large inventory lists should not freeze the UI.
128. Use debounce for search where suitable.
129. Use pagination or virtualization where needed.
130. Avoid unnecessary re-renders.
131. Memoize expensive calculations where suitable.
132. Lazy-load heavy components where suitable.
133. Reduce unnecessary client-side JavaScript.
134. Optimize images, fonts, icons, CSS, and large JSON imports.
135. Avoid heavy libraries unless necessary.
136. Check bundle size where possible.

## SEO / Schema Rules

137. Implement strong dynamic on-page SEO for public pages.
138. Use unique title, meta description, canonical URL, Open Graph, Twitter tags, robots meta, sitemap, manifest/PWA metadata where applicable.
139. Use valid structured data/schema such as Organization, SoftwareApplication, WebApplication, Website, Breadcrumb, FAQ, and LocalBusiness where suitable.
140. Avoid spammy SEO.
141. Do not overpromise search ranking.
142. Private dashboard pages should not be indexed if unsuitable.
143. Public pages should be indexable where suitable.
144. SEO text should come from `en.ts` where suitable.

## Lighthouse / Core Web Vitals Rules

145. Public pages should target Lighthouse 100/100 where technically possible.
146. Minimum acceptable target should be 95+ for Performance, Accessibility, Best Practices, and SEO where technically possible.
147. Fix every actionable Lighthouse audit safely.
148. Optimize Core Web Vitals:
    - LCP
    - INP
    - CLS
149. Also check FCP, TBT, Speed Index, TTFB where possible.
150. Do not remove useful functionality only to improve Lighthouse score.
151. Do not add heavy libraries for UI, animation, SEO, or PWA.
152. Verify mobile and desktop Lighthouse where possible.
153. If 100/100 is not possible due to environment, third-party scripts, auth, local data, framework limitations, or testing limitations, document the reason clearly and provide the safest improvement.
154. PWA improvements should be added only if safe and not harmful to inventory/local data.
155. Do not add risky service worker caching that may break app data.

## Accessibility Rules

156. Follow basic accessibility best practices.
157. Use semantic HTML.
158. Buttons and links must have accessible names.
159. Inputs must have associated labels.
160. Modals must have proper aria attributes and focus behavior.
161. Keyboard navigation must work.
162. Focus states must be visible.
163. Color contrast must pass in light and dark mode.
164. Images should have alt text.
165. Tables should have accessible headers.
166. Do not use clickable divs without keyboard support.

## Export / Backup / Report Rules

167. Add or improve safe export/share features where suitable.
168. Support print receipt, download invoice/receipt, export inventory CSV/Excel, export sales report, export purchase report, and export GST report where data exists.
169. Backup/restore/import should be added only with proper validation and without risking data loss.
170. Reports should remain simple, visual, responsive, fast, and useful for shopkeepers.
171. Dashboard/reports should show useful insights where data exists: total products, stock value, low/critical/out stock count, today's sale, today's purchase, monthly sale, monthly purchase, GST collected, GST paid, top selling products, slow moving products, recent transactions, and due/pending payments.

## Payment / Due Tracking Rules

172. Where relevant, support payment mode, payment status, amount paid, balance/due amount, payment date, and note/reference number.
173. Payment modes may include Cash, UPI, Card, Bank Transfer, Credit, and Other.
174. Payment status may include Paid, Partial, and Unpaid.
175. Use payment details in sale, purchase, GST invoice, supplier payment, receipt print, share message, and reports where applicable.

## Local DB / Sync Rules

176. If app uses Dexie/local DB/Supabase/Firebase/sync logic, audit carefully before changes.
177. Do not break existing data.
178. Improve offline behavior, data consistency, sync status, failed sync handling, retry behavior, duplicate prevention, and conflict handling only where safe.
179. Show user-friendly feedback when offline or sync fails.

## Testing / Final Response Rules

180. Run lint, typecheck, build, or the closest available verification after meaningful changes when safe and available.
180a. Before reporting completion, inspect affected flows end-to-end and verify there are no silent failures in related UI states.
181. If scripts are missing, inspect `package.json` and run closest available commands.
182. Fix build, lint, TypeScript, hydration, runtime, console, and import errors before final response where the current environment allows it.
183. At the end of each phase, provide:
    - files changed
    - summary of changes
    - commands run
    - errors fixed
    - remaining risks or pending items
184. Do not mark a phase complete if important broken flows remain untested.
185. If something is not possible or risky in the current architecture, clearly explain why and suggest the safest alternative.
