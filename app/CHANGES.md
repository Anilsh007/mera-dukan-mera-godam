# Final architecture, UI, performance and SEO pass

## Reusable architecture
- Added centralized SEO configuration in `app/lib/seo/site.ts`.
- Added centralized JSON-LD schema builders in `app/lib/seo/schema.ts`.
- Added reusable `JsonLd`, `PublicPageShell`, `PageHeader`, `SurfaceCard`, and `StatusBadge` components.
- Updated public pages to share one shell and one metadata/schema system.

## Reports refactor
- Split the large Reports page into focused components and report utilities.
- Moved report calculations, date ranges, sales trend generation, formatting, CSV export, and data loading into small files.
- Kept the Reports page as a clean orchestration layer.

## UI and theme polish
- Enhanced light and dark color tokens for better contrast and premium visual depth.
- Added reusable glass-card styling through `.app-card`.
- Improved dashboard card consistency and hover states.
- Added print-friendly card behavior.

## SEO and schema
- Added dynamic metadata generation for public pages.
- Added WebPage and BreadcrumbList JSON-LD per public page.
- Added FAQPage schema for FAQ.
- Added global Organization, WebSite and SoftwareApplication schema.
- Added manifest metadata for better PWA/Lighthouse signals.
- Updated sitemap and robots from the same SEO source of truth.

## Lighthouse-oriented improvements
- Kept dashboard pages blocked from indexing because they are protected/private.
- Centralized public metadata, canonical URLs and language alternates.
- Reduced Reports page size and improved component reuse for maintainability and bundle hygiene.
