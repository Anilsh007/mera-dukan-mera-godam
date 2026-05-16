"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Languages } from "lucide-react";
import {
  getCurrentLanguage,
  getLanguageOption,
  INDIAN_LANGUAGE_OPTIONS,
  persistLanguage,
  type LanguageCode,
} from "@/app/messages/translationRuntime";
import { en } from "@/app/messages/en";

export default function LanguageSelector() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(() => getLanguageOption(getCurrentLanguage()));
  const ref = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  useEffect(() => {
    document.documentElement.lang = active.locale;
    document.documentElement.dir = active.code === "ur" || active.code === "ks" || active.code === "sd" ? "rtl" : "ltr";
  }, [active]);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const chooseLanguage = (code: LanguageCode) => {
    const option = getLanguageOption(code);
    persistLanguage(option.code);
    setActive(option);
    setOpen(false);
    window.location.reload();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-10 items-center gap-2 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-header)] px-3 text-sm font-semibold text-[var(--text-primary)] shadow-[var(--shadow-header)] transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:bg-[var(--bg-elevated)]"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={en.navigation.chooseLanguage}
        aria-controls={open ? listboxId : undefined}
      >
        <Languages size={17} aria-hidden="true" />
        <span className="hidden sm:inline">{active.nativeName}</span>
        <span className="sm:hidden">{active.code.toUpperCase()}</span>
        <ChevronDown size={14} aria-hidden="true" />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 grid max-h-[70vh] w-[min(22rem,calc(100vw-1rem))] grid-cols-1 gap-1 overflow-y-auto rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-2 shadow-[var(--shadow-card)] backdrop-blur-xl sm:grid-cols-2" role="listbox" id={listboxId}>
          {INDIAN_LANGUAGE_OPTIONS.map((language) => (
            <button
              key={language.code}
              type="button"
              role="option"
              aria-selected={language.code === active.code}
              onClick={() => chooseLanguage(language.code)}
              className={`rounded-xl px-3 py-2 text-left text-sm transition hover:bg-[var(--sidebar-hover)] ${language.code === active.code ? "bg-[var(--accent-soft)] font-bold text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}
            >
              <span className="block">{language.nativeName}</span>
              <span className="block text-xs text-[var(--text-muted)]">{language.englishName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
