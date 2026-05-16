# AGENTS.md - Mera Dukan Mera Godam Project Rules

These durable rules apply to all current and future phases of the **Mera Dukan Mera Godam** project.

Project type: Next.js / React / TypeScript stock inventory management, GST billing, purchase/sale, reports, print/receipt web app for Indian small shopkeepers and low-technical users.

## Common Project Rules

1. First inspect existing code before making changes.
2. Do not blindly rewrite the full app.
3. Preserve existing working features.
4. Do not remove features unless they are broken and replaced with a better working implementation.
5. Do not modify `.env`, `.env.local`, secrets, API keys, or private credentials.
6. Keep code TypeScript-safe, clean, scalable, and maintainable.
7. Avoid `any` unless absolutely necessary.
8. Keep business logic in reusable utilities/hooks.
9. Avoid duplicate logic.
10. Remove dead code only when safe.

## Text / Localization Rules

11. Keep all user-facing text in `en.ts` or the existing language/text constants system.
12. Do not hardcode visible labels, messages, placeholders, table headings, modal text, invoice text, receipt text, GST text, validation text, SEO text, or toast text directly inside components.
13. All button labels, form labels, placeholders, helper text, validation messages, success messages, error messages, warnings, empty states, modal titles, modal descriptions, table headings, filter labels, sorting labels, invoice labels, receipt labels, GST labels, profile labels, report labels, navigation labels, SEO text, toast messages, and share messages must come from `en.ts`.
14. Organize `en.ts` by modules such as `common`, `navigation`, `dashboard`, `inventory`, `quickPurchase`, `purchases`, `gstInvoice`, `profile`, `reports`, `suppliers`, `validation`, `modals`, `receipt`, `print`, `share`, `seo`, `errors`, `success`, `warnings`, `emptyStates`, and `toast`.
15. Future translation should be easy.

## Reusable Component Rules

16. Prefer reusable components from `app/components/ui`.
17. Do not duplicate Button, Input, Table, Modal, Receipt, Print, GST, Share, Toast, Validation, Card, or Badge logic.
18. Improve shared components instead of writing repeated UI inside pages.
19. Use consistent UI patterns for buttons, inputs, tables, cards, badges, modals, forms, empty states, loading states, error states, and success states.
20. Existing reusable components should be improved and reused wherever possible.

## Modal / Popup Rules

21. Use one common reusable Modal/Dialog component wherever possible.
22. All popups/modals should have consistent layout, title, description, content area, footer actions, cancel button, primary action button, loading state, error state, close button, ESC close, responsive layout, and accessibility.
23. Destructive actions must require confirmation.
24. Modals must work properly on mobile, tablet, and desktop.
25. Modal text must come from `en.ts`.

## Toast / Notification Rules

26. Every important user action must show toast/notification feedback.
27. No action should fail silently.
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
30. Create or improve one reusable toast/notification system.
30a. Mount the toast container once globally in the root app layout inside a client-capable provider so it persists across navigation.
30b. Keep toast UI above modals, drawers, tables, and dashboard content, and avoid DOM rewriting or translation passes mutating toast container nodes.
31. Do not use random browser alert messages unless absolutely necessary.
32. Toast messages must be simple and user-friendly.
33. Technical errors can be logged safely, but the user should see simple helpful messages.
34. All toast text must come from `en.ts`.

## Share System Rules

35. Important transaction details should be shareable anytime from relevant screens.
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
46. All share labels/messages must come from `en.ts`.

## Print / Receipt / Invoice Rules

47. Print, receipt, and invoice should use one reusable component wherever possible.
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
53. Print/receipt/invoice labels must come from `en.ts`.

## GST Rules

54. GST calculation must be reusable and reliable.
55. Do not duplicate GST calculation logic in multiple pages.
56. GST should be implemented wherever required: sale, purchase, quick purchase, detailed purchase, multi item sale, GST invoice, receipt, print, and reports where applicable.
57. GST utilities should handle taxable amount, GST percentage, CGST, SGST, IGST, total GST, grand total, and GSTIN validation.
58. If seller and buyer are in the same state, use CGST + SGST where state data is available.
59. If seller and buyer are in different states, use IGST where state data is available.
60. If state data is unavailable, use a safe fallback and show clear UI.
61. GST invoice should use business profile details.
62. GST invoice generation should warn user if required profile/GST details are missing.
63. Invoice totals must always match item totals.
64. GST labels/messages must come from `en.ts`.

## Inventory / Business Logic Rules

65. Purchase must increase stock correctly.
66. Add stock must increase stock correctly.
67. Sale stock must decrease stock correctly.
68. Multi item sale must update all selected products correctly.
69. Stock should not go negative unless explicitly allowed.
70. Product edit must not corrupt stock history.
70a. Do not directly overwrite current stock inside edit forms unless the change is routed through a safe adjustment/history flow.
71. Product delete must require confirmation.
72. Low stock, critical stock, and out of stock status must calculate correctly.
73. Search, filter, and sorting must work correctly.
74. Every stock-changing action should create a transaction/history record where possible.
75. Transaction history should track transaction type, product/items, old stock, new stock, quantity changed, date/time, amount, GST details, payment mode/status, customer/supplier reference, receipt/invoice number, and notes where possible.

## Profile Integration Rules

76. Profile details must be used in GST invoices and receipts.
77. Profile details should include or support business name, owner name, logo, address, city, state, pincode, mobile, email, GSTIN, business type, terms and conditions, and bank/UPI/payment details where available.
78. If profile is incomplete, show clear warning and guide user to profile page.
79. Do not allow proper GST invoice generation if required GST/profile details are missing unless user confirms simple receipt/non-GST flow.

## Responsive Design Rules

80. App must be fully responsive across small mobile, large mobile, tablet, laptop, desktop, and wide screens.
81. No horizontal overflow on mobile.
82. Tables should become horizontally scrollable or card-based on mobile.
83. Buttons must not overlap.
84. Inputs must not overflow.
85. Modals must fit mobile screen.
86. Forms should become single-column on mobile.
87. Dashboard navigation should be mobile-friendly.
88. Touch targets must be easy to tap.
89. Font sizes must be readable.
90. All functionality must work on every device.
91. Print preview must remain clean and usable.

## UI / Dark Mode / 3D Depth Rules

92. UI should support both light and dark mode.
92a. Dark mode must remain high-contrast, professional, comfortable, and visually positive. Avoid dull, muddy, overly black, or depressing color palettes.
93. Use subtle professional 3D/depth UI only.
94. Do not use heavy 3D libraries unless absolutely necessary.
95. Performance and usability are more important than decoration.
96. Use soft shadows, layered cards, slight gradients, hover lift, pressed button states, and premium SaaS-style surfaces where suitable.
97. Respect `prefers-reduced-motion`.
98. Avoid childish, heavy, or over-animated UI.
99. Keep UI simple for shopkeepers and low-technical users.

## Performance Rules

100. Website should be fast on low-end mobile devices.
101. Optimize search, filter, and sort.
102. Large inventory lists should not freeze the UI.
103. Use debounce for search where suitable.
104. Use pagination or virtualization where needed.
105. Avoid unnecessary re-renders.
106. Memoize expensive calculations where suitable.
107. Lazy-load heavy components where suitable.
108. Reduce unnecessary client-side JavaScript.
109. Optimize images, fonts, icons, CSS, and large JSON imports.
110. Avoid heavy libraries unless necessary.
111. Check bundle size where possible.

## SEO / Schema Rules

112. Implement strong dynamic on-page SEO for public pages.
113. Use unique title, meta description, canonical URL, Open Graph, Twitter tags, robots meta, sitemap, manifest/PWA metadata where applicable.
114. Use valid structured data/schema such as Organization, SoftwareApplication, WebApplication, Website, Breadcrumb, FAQ, and LocalBusiness where suitable.
115. Avoid spammy SEO.
116. Do not overpromise search ranking.
117. Private dashboard pages should not be indexed if unsuitable.
118. Public pages should be indexable where suitable.
119. SEO text should come from `en.ts` where suitable.

## Lighthouse / Core Web Vitals Rules

120. Public pages should target Lighthouse 100/100 where technically possible.
121. Minimum acceptable target should be 95+ for Performance, Accessibility, Best Practices, and SEO where technically possible.
122. Fix every actionable Lighthouse audit safely.
123. Optimize Core Web Vitals:
    - LCP
    - INP
    - CLS
124. Also check FCP, TBT, Speed Index, TTFB where possible.
125. Do not remove useful functionality only to improve Lighthouse score.
126. Do not add heavy libraries for UI, animation, SEO, or PWA.
127. Verify mobile and desktop Lighthouse where possible.
128. If 100/100 is not possible due to environment, third-party scripts, auth, local data, framework limitations, or testing limitations, document the reason clearly and provide the safest improvement.
129. PWA improvements should be added only if safe and not harmful to inventory/local data.
130. Do not add risky service worker caching that may break app data.

## Accessibility Rules

131. Follow basic accessibility best practices.
132. Use semantic HTML.
133. Buttons and links must have accessible names.
134. Inputs must have associated labels.
135. Modals must have proper aria attributes and focus behavior.
136. Keyboard navigation must work.
137. Focus states must be visible.
138. Color contrast must pass in light and dark mode.
139. Images should have alt text.
140. Tables should have accessible headers.
141. Do not use clickable divs without keyboard support.

## Export / Backup / Report Rules

142. Add or improve safe export/share features where suitable.
143. Support print receipt, download invoice/receipt, export inventory CSV/Excel, export sales report, export purchase report, and export GST report where data exists.
144. Backup/restore/import should be added only with proper validation and without risking data loss.
145. Reports should remain simple, visual, responsive, fast, and useful for shopkeepers.
146. Dashboard/reports should show useful insights where data exists: total products, stock value, low/critical/out stock count, today's sale, today's purchase, monthly sale, monthly purchase, GST collected, GST paid, top selling products, slow moving products, recent transactions, and due/pending payments.

## Payment / Due Tracking Rules

147. Where relevant, support payment mode, payment status, amount paid, balance/due amount, payment date, and note/reference number.
148. Payment modes may include Cash, UPI, Card, Bank Transfer, Credit, and Other.
149. Payment status may include Paid, Partial, and Unpaid.
150. Use payment details in sale, purchase, GST invoice, supplier payment, receipt print, share message, and reports where applicable.

## Local DB / Sync Rules

151. If app uses Dexie/local DB/Supabase/Firebase/sync logic, audit carefully before changes.
152. Do not break existing data.
153. Improve offline behavior, data consistency, sync status, failed sync handling, retry behavior, duplicate prevention, and conflict handling only where safe.
154. Show user-friendly feedback when offline or sync fails.

## Testing / Final Response Rules

155. Run lint/typecheck/build after meaningful changes.
155a. Before reporting completion, inspect affected flows end-to-end and verify there are no silent failures in related UI states.
156. If scripts are missing, inspect `package.json` and run closest available commands.
157. Fix build, lint, TypeScript, hydration, runtime, console, and import errors before final response.
158. At the end of each phase, provide:
    - files changed
    - summary of changes
    - commands run
    - errors fixed
    - remaining risks or pending items
159. Do not mark a phase complete if important broken flows remain untested.
160. If something is not possible or risky in the current architecture, clearly explain why and suggest the safest alternative.
