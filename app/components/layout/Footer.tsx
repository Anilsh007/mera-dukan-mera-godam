// components/layout/Footer.tsx

import Link from "next/link";
import {
  Mail,
  ShieldCheck,
  FileText,
  HelpCircle,
  MapPin,
} from "lucide-react";
import { en } from "@/app/messages/en";
import { BsWhatsapp } from "react-icons/bs";

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

            <p className="mt-6">
              <a href="mailto:mdmg.ind@gmail.com" target="_blank" rel="noopener noreferrer" aria-label={en.seo.emailSupport} className="flex items-center gap-2 w-fit p-2 text-[#25D366] transition hover:border-[var(--accent)] hover:text-[#ffffff]" >
                <Mail size={18} aria-hidden="true" />
                <span>mdmg.ind@gmail.com</span>
              </a>
            </p>

            <p>
              <a href="https://wa.me/9301848229" target="_blank" rel="noopener noreferrer" aria-label={en.seo.whatsappSupport} className="flex items-center gap-2 w-fit p-2 text-[#25D366] transition hover:border-[var(--accent)] hover:text-[#ffffff]" >
                <BsWhatsapp size={18} aria-hidden="true" />
                <span>+91-9301848229</span>
              </a>
            </p>

            <p>
              <a href="https://wa.me/9301848229" target="_blank" rel="noopener noreferrer" aria-label={en.seo.whatsappSupport} className="flex items-center gap-2 w-fit p-2 text-[#25D366] transition hover:border-[var(--accent)] hover:text-[#ffffff]" >
                <MapPin size={18} aria-hidden="true" />
                <span>Amlori Colony, District:- Singrauli, Madhya Pradesh, India 486887</span>
              </a>
            </p>

          </div>

          {/* {en.seo.navigation} */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-primary)]">{en.seo.navigation}</h3>

            <ul className="mt-5 space-y-4 text-sm text-[var(--text-secondary)]">
              <li>
                <Link href="/about" className="transition hover:text-[var(--text-primary)]">{en.seo.about}</Link>
              </li>

              <li>
                <Link href="/faq" className="transition hover:text-[var(--text-primary)]">{en.seo.faq}</Link>
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
            © {new Date().getFullYear()} {en.common.appName}. {en.seo.allRightsReserved}
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

