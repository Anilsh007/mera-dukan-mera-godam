import { uiText } from "@/app/messages/uiText";

export default function TermsPage() {
  return (
    <main className="public-content min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)]">
      {/* Hero Section */}
      <section className="border-b border-[var(--border-card)] bg-[var(--bg-elevated)]">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <span className="rounded-full border border-[var(--border-card)] bg-[var(--bg-card-strong)] px-4 py-1 text-sm font-medium text-[var(--text-secondary)]">{uiText("Legal")}</span>

          <h1 className="mt-6 text-4xl font-bold md:text-5xl">{uiText("Terms & Conditions")}</h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-[var(--text-secondary)]">{uiText("These Terms & Conditions govern your use of this inventory management platform and related services.")}</p>

          <p className="mt-4 text-sm text-[var(--text-muted)]">{uiText("Last updated: May 11, 2026")}</p>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="space-y-10 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-8 shadow-[var(--shadow-card)] backdrop-blur-xl">
          {/* Section 1 */}
          <div>
            <h2 className="text-2xl font-semibold">{uiText("1. Acceptance of Terms")}</h2>

            <p className="mt-4 leading-8 text-[var(--text-secondary)]">{uiText("By accessing or using this platform, you agree to comply with these Terms & Conditions and all applicable laws and regulations.")}</p>

            <p className="mt-4 leading-8 text-[var(--text-secondary)]">{uiText("If you do not agree with any part of these terms, you should not use the platform.")}</p>
          </div>

          {/* Section 2 */}
          <div>
            <h2 className="text-2xl font-semibold">{uiText("2. Platform Description")}</h2>

            <p className="mt-4 leading-8 text-[var(--text-secondary)]">{uiText("This platform provides tools and features for inventory management, including stock tracking, purchases, supplier management, invoices, reports, and related operational workflows.")}</p>

            <p className="mt-4 leading-8 text-[var(--text-secondary)]">{uiText("Features may change, improve, or evolve over time as the platform continues development.")}</p>
          </div>

          {/* Section 3 */}
          <div>
            <h2 className="text-2xl font-semibold">{uiText("3. User Responsibilities")}</h2>

            <p className="mt-4 leading-8 text-[var(--text-secondary)]">{uiText("Users are responsible for maintaining the confidentiality of their account credentials and for all activities performed through their account.")}</p>

            <p className="mt-4 leading-8 text-[var(--text-secondary)]">{uiText("You agree not to misuse the platform, attempt unauthorized access, disrupt system operations, or use the service for unlawful purposes.")}</p>
          </div>

          {/* Section 4 */}
          <div>
            <h2 className="text-2xl font-semibold">{uiText("4. Data and Content")}</h2>

            <p className="mt-4 leading-8 text-[var(--text-secondary)]">{uiText("You retain ownership of the business, inventory, and operational data entered into the platform.")}</p>

            <p className="mt-4 leading-8 text-[var(--text-secondary)]">{uiText("You are responsible for ensuring the accuracy, legality, and reliability of the information stored within your account.")}</p>
          </div>

          {/* Section 5 */}
          <div>
            <h2 className="text-2xl font-semibold">{uiText("5. Service Availability")}</h2>

            <p className="mt-4 leading-8 text-[var(--text-secondary)]">{uiText("While efforts are made to maintain platform availability and stability, uninterrupted access cannot be guaranteed at all times.")}</p>

            <p className="mt-4 leading-8 text-[var(--text-secondary)]">{uiText("Maintenance, updates, technical issues, or external factors may temporarily affect service availability.")}</p>
          </div>

          {/* Section 6 */}
          <div>
            <h2 className="text-2xl font-semibold">{uiText("6. Limitation of Liability")}</h2>

            <p className="mt-4 leading-8 text-[var(--text-secondary)]">{uiText("This platform is provided on an \u201cas available\u201d and \u201cas is\u201d basis without warranties of any kind.")}</p>

            <p className="mt-4 leading-8 text-[var(--text-secondary)]">{uiText("To the maximum extent permitted by law, the platform shall not be liable for business losses, data loss, interruptions, or indirect damages resulting from the use of the service.")}</p>
          </div>

          {/* Section 7 */}
          <div>
            <h2 className="text-2xl font-semibold">{uiText("7. Security")}</h2>

            <p className="mt-4 leading-8 text-[var(--text-secondary)]">{uiText("Users should take appropriate measures to protect account access, passwords, devices, and sensitive business information.")}</p>

            <p className="mt-4 leading-8 text-[var(--text-secondary)]">{uiText("Although reasonable security practices are implemented, no digital system can guarantee complete protection against all threats.")}</p>
          </div>

          {/* Section 8 */}
          <div>
            <h2 className="text-2xl font-semibold">{uiText("8. Intellectual Property")}</h2>

            <p className="mt-4 leading-8 text-[var(--text-secondary)]">{uiText("The platform design, branding, software, and related content are protected by applicable intellectual property rights.")}</p>

            <p className="mt-4 leading-8 text-[var(--text-secondary)]">{uiText("Users may not copy, distribute, reverse engineer, or reproduce parts of the platform without permission.")}</p>
          </div>

          {/* Section 9 */}
          <div>
            <h2 className="text-2xl font-semibold">{uiText("9. Future Changes")}</h2>

            <p className="mt-4 leading-8 text-[var(--text-secondary)]">{uiText("These Terms & Conditions may be updated or modified over time as the platform evolves.")}</p>

            <p className="mt-4 leading-8 text-[var(--text-secondary)]">{uiText("Continued use of the service after updates means you accept the revised terms.")}</p>
          </div>

          {/* Section 10 */}
          <div>
            <h2 className="text-2xl font-semibold">{uiText("10. Termination")}</h2>

            <p className="mt-4 leading-8 text-[var(--text-secondary)]">{uiText("Access to the platform may be suspended or terminated if misuse, abuse, security threats, or violations of these terms are identified.")}</p>
          </div>

          {/* Section 11 */}
          <div>
            <h2 className="text-2xl font-semibold">{uiText("11. Contact")}</h2>

            <p className="mt-4 leading-8 text-[var(--text-secondary)]">{uiText("For questions regarding these Terms & Conditions, please contact support through the official support page.")}</p>
          </div>
        </div>
      </section>
    </main>
  );
}
