// components/layout/Footer.tsx

import Link from "next/link";
import {
  Mail,
  ShieldCheck,
  FileText,
  HelpCircle,
} from "lucide-react";
import { en } from "@/app/messages/en";

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border-card)] bg-[var(--bg-card-strong)] text-[var(--text-primary)] backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-12 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[linear-gradient(135deg,var(--accent),color-mix(in_srgb,var(--accent)_74%,#ec4899_26%))] text-lg font-bold text-white shadow-[var(--button-shadow)]">
                {en.common.appName.split(" ").map((word) => word[0]).join("")}
              </div>

              <div>
                <h2 className="text-lg font-semibold">
                  {en.common.appName}
                </h2>

                <p className="text-sm text-[var(--text-muted)]">
                  {en.common.tagLine}
                </p>
              </div>
            </div>

            <p className="mt-6 max-w-2xl leading-8 text-[var(--text-secondary)]">
              {en.seo.platformDescription}
            </p>

            <p className="mt-4 leading-8 text-[var(--text-secondary)]">
              {en.seo.startupDescription}
            </p>

            {/* Socials */}
            <div className="mt-6 flex items-center gap-4">
              

              <a
                href="mailto:mdmg.ind@gmail.com"
                aria-label={en.seo.emailSupport}
                className="rounded-xl border border-[var(--border-card)] bg-[var(--bg-elevated)] p-3 text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:bg-[var(--surface-soft-strong)] hover:text-[var(--text-primary)]"
              >
                <Mail size={18} aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* {en.seo.navigation} */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-primary)]">
              {en.seo.navigation}
            </h3>

            <ul className="mt-5 space-y-4 text-sm text-[var(--text-secondary)]">
              <li>
                <Link
                  href="/about"
                  className="transition hover:text-[var(--text-primary)]"
                >
                  {en.seo.about}
                </Link>
              </li>

              <li>
                <Link
                  href="/faq"
                  className="transition hover:text-[var(--text-primary)]"
                >
                  {en.seo.faq}
                </Link>
              </li>

              <li>
                <Link
                  href="/support"
                  className="transition hover:text-[var(--text-primary)]"
                >
                  {en.seo.support}
                </Link>
              </li>

              <li>
                <Link
                  href="/dashboard"
                  className="transition hover:text-[var(--text-primary)]"
                >
                  {en.navigation.overview}
                </Link>
              </li>
            </ul>
          </div>

          {/* {en.seo.legal} */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-primary)]">
              {en.seo.legal}
            </h3>

            <ul className="mt-5 space-y-4 text-sm text-[var(--text-secondary)]">
              <li>
                <Link
                  href="/privacy-policy"
                  className="flex items-center gap-2 transition hover:text-[var(--text-primary)]"
                >
                  <ShieldCheck size={16} aria-hidden="true" />
                  {en.seo.privacyPolicy}
                </Link>
              </li>

              <li>
                <Link
                  href="/terms"
                  className="flex items-center gap-2 transition hover:text-[var(--text-primary)]"
                >
                  <FileText size={16} aria-hidden="true" />
                  {en.seo.termsConditions}
                </Link>
              </li>

              <li>
                <Link
                  href="/faq"
                  className="flex items-center gap-2 transition hover:text-[var(--text-primary)]"
                >
                  <HelpCircle size={16} aria-hidden="true" />
                  {en.seo.helpCenter}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="my-10 border-t border-[var(--border-card)]" />

        {/* Bottom */}
        <div className="flex flex-col gap-4 text-sm text-[var(--text-muted)] md:flex-row md:items-center md:justify-between">
          <p>
            Â© {new Date().getFullYear()} {en.common.appName}. {en.seo.allRightsReserved}
          </p>

          <div className="flex items-center gap-6">
            <Link
              href="/privacy-policy"
              className="transition hover:text-[var(--text-primary)]"
            >
              {en.seo.privacy}
            </Link>

            <Link
              href="/terms"
              className="transition hover:text-[var(--text-primary)]"
            >
              {en.seo.terms}
            </Link>

            <Link
              href="/support"
              className="transition hover:text-[var(--text-primary)]"
            >
              {en.seo.support}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

