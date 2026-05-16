// components/layout/Footer.tsx

import Link from "next/link";
import {
  Github,
  Mail,
  ShieldCheck,
  FileText,
  HelpCircle,
} from "lucide-react";
import { en } from "@/app/messages/en";

export default function Footer() {
  return (
    <footer className="border-t bg-white">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-12 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-black text-lg font-bold text-white">
                {en.seo.inventoryManagementSystem.split(" ").map((word) => word[0]).join("")}
              </div>

              <div>
                <h2 className="text-lg font-semibold">
                  {en.seo.inventoryManagementSystem}
                </h2>

                <p className="text-sm text-gray-500">
                  {en.seo.modernInventoryManagementPlatform}
                </p>
              </div>
            </div>

            <p className="mt-6 max-w-2xl leading-8 text-gray-600">
              {en.seo.platformDescription}
            </p>

            <p className="mt-4 leading-8 text-gray-600">
              {en.seo.startupDescription}
            </p>

            {/* Socials */}
            <div className="mt-6 flex items-center gap-4">
              <a
                href="https://github.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={en.seo.githubProfile}
                className="rounded-xl border border-gray-200 p-3 text-gray-700 transition hover:bg-gray-100"
              >
                <Github size={18} aria-hidden="true" />
              </a>

              <a
                href="mailto:support@yourdomain.com"
                aria-label={en.seo.emailSupport}
                className="rounded-xl border border-gray-200 p-3 text-gray-700 transition hover:bg-gray-100"
              >
                <Mail size={18} aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* {en.seo.navigation} */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900">
              {en.seo.navigation}
            </h3>

            <ul className="mt-5 space-y-4 text-sm text-gray-600">
              <li>
                <Link
                  href="/about"
                  className="transition hover:text-black"
                >
                  {en.seo.about}
                </Link>
              </li>

              <li>
                <Link
                  href="/faq"
                  className="transition hover:text-black"
                >
                  {en.seo.faq}
                </Link>
              </li>

              <li>
                <Link
                  href="/support"
                  className="transition hover:text-black"
                >
                  {en.seo.support}
                </Link>
              </li>

              <li>
                <Link
                  href="/dashboard"
                  className="transition hover:text-black"
                >
                  {en.navigation.overview}
                </Link>
              </li>
            </ul>
          </div>

          {/* {en.seo.legal} */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900">
              {en.seo.legal}
            </h3>

            <ul className="mt-5 space-y-4 text-sm text-gray-600">
              <li>
                <Link
                  href="/privacy-policy"
                  className="flex items-center gap-2 transition hover:text-black"
                >
                  <ShieldCheck size={16} aria-hidden="true" />
                  {en.seo.privacyPolicy}
                </Link>
              </li>

              <li>
                <Link
                  href="/terms"
                  className="flex items-center gap-2 transition hover:text-black"
                >
                  <FileText size={16} aria-hidden="true" />
                  {en.seo.termsConditions}
                </Link>
              </li>

              <li>
                <Link
                  href="/faq"
                  className="flex items-center gap-2 transition hover:text-black"
                >
                  <HelpCircle size={16} aria-hidden="true" />
                  {en.seo.helpCenter}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="my-10 border-t border-gray-200" />

        {/* Bottom */}
        <div className="flex flex-col gap-4 text-sm text-gray-500 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {en.seo.inventoryManagementSystem}. {en.seo.allRightsReserved}
          </p>

          <div className="flex items-center gap-6">
            <Link
              href="/privacy-policy"
              className="transition hover:text-black"
            >
              {en.seo.privacy}
            </Link>

            <Link
              href="/terms"
              className="transition hover:text-black"
            >
              {en.seo.terms}
            </Link>

            <Link
              href="/support"
              className="transition hover:text-black"
            >
              {en.seo.support}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}