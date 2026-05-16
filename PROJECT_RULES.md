# PROJECT_RULES.md - Mera Dukan Mera Godam

These rules apply to future work across the project.

## Change Safety

1. Inspect existing code, services, DB flow, state flow, and reusable UI before changing anything.
2. Preserve working features. Make safe incremental changes only.
3. Do not rewrite the whole app unless explicitly requested.
4. Do not modify `.env`, `.env.local`, secrets, API keys, or credentials.

## Text and UX

5. All visible user-facing text must come from `app/messages/en.ts` or the existing localization system.
6. Avoid hardcoded labels, placeholders, table headings, modal copy, validation copy, toast copy, invoice text, receipt text, and share text in components.
7. Important actions must show clear toast feedback for success, error, warning, validation, print, share, download, and sync cases.
7a. Use one global client-mounted toaster in the root layout and keep it visible above modals/drawers.
8. No important action should fail silently.
9. Destructive actions must require explicit confirmation.

## Reuse and Architecture

10. Prefer reusable UI from `app/components/ui`.
11. Reuse common Button, Input, Modal, Toast, Table, Card, Share, and transaction document logic instead of duplicating it.
12. Keep business logic in reusable services, hooks, and utilities where practical.
13. Avoid duplicate logic and remove dead code only when it is clearly safe.

## Inventory and Data Integrity

14. Preserve stock-history correctness for every stock-changing action.
15. Do not directly overwrite current stock in edit forms unless the change goes through a safe adjustment/history mechanism.
16. Product edit must not corrupt stock history or transaction accuracy.
17. Stock should not go negative unless an existing flow explicitly allows it.
18. Search, filter, sort, category grouping, low stock, critical stock, and out-of-stock indicators must keep working after changes.

## GST, Profile, Receipt, and Share Safety

19. GST logic must stay reusable and reliable.
20. Profile data must remain wired into receipts, invoices, and transaction documents where applicable.
21. Receipt, print, share, and download flows should reuse the common transaction document/share utilities where possible.

## Quality and Delivery

22. Preserve responsive behavior across mobile, tablet, and desktop.
23. Preserve light mode, dark mode, accessibility basics, keyboard support, and focus visibility.
23a. Dark mode must stay high-contrast, professional, comfortable, and visually positive. Avoid dull, muddy, overly black, or depressing palettes, and keep all states readable.
24. Keep performance safe for large inventory lists. Avoid heavy libraries unless necessary.
25. Run the available checks before reporting completion:
   - `npm run typecheck` or closest equivalent
   - `npm run lint` or closest equivalent
   - `npm run build` or closest equivalent
26. If a command cannot run, document the reason clearly and still report code-level findings honestly.
