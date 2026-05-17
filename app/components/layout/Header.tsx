"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { signOut, onAuthStateChanged, User } from "firebase/auth";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { auth } from "@/app/lib/firebase";
import ThemeToggle from "@/app/components/theme/ThemeToggle";
import Link from "next/link";
import { LogOut, Menu, User as UserIcon, UserCog, X } from "lucide-react";
import logo from "@/assets/logo.webp";
import { en } from "@/app/messages/en";

const accountMenuId = "account-menu";
const publicNavItems = [
  { href: "/", label: en.seo.home },
  { href: "/about", label: en.seo.about },
  { href: "/faq", label: en.seo.faq },
  { href: "/support", label: en.navigation.support },
];

function isPublicLoginRoute(pathname: string) {
  return pathname === "/" || pathname === "/login";
}

export default function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(!auth);
  const [accountMenuPath, setAccountMenuPath] = useState<string | null>(null);
  const [mobileNavPath, setMobileNavPath] = useState<string | null>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const isDashboardHeader = Boolean(onMenuClick);
  const accountOpen = accountMenuPath === pathname;
  const mobileNavOpen = mobileNavPath === pathname;

  useEffect(() => {
    if (!auth) return;

    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthChecked(true);
    });
  }, []);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setAccountMenuPath(null);
      }
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAccountMenuPath(null);
        setMobileNavPath(null);
      }
    };

    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push("/");
  };

  const authAction = useMemo(() => {
    if (!authChecked || user) {
      return {
        href: "/dashboard",
        label: en.navigation.backToDashboard,
        active: pathname.startsWith("/dashboard"),
      };
    }

    return {
      href: "/login",
      label: en.navigation.login,
      active: isPublicLoginRoute(pathname),
    };
  }, [authChecked, pathname, user]);

  const navLinkClass = (active: boolean) =>
    `inline-flex min-h-11 items-center rounded-2xl border px-3 py-2 text-sm font-semibold transition ${active
      ? "border-[var(--accent)] bg-[linear-gradient(135deg,var(--accent-soft),color-mix(in_srgb,var(--accent-soft)_70%,white_30%))] text-[var(--text-primary)] shadow-[var(--button-shadow)]"
      : "border-[var(--border-card)] bg-[var(--bg-card-strong)] text-[var(--text-secondary)] shadow-[var(--button-shadow)] hover:border-[var(--accent)] hover:bg-[var(--surface-primary)] hover:text-[var(--text-primary)]"
    }`;

  const actionLinkClass = (active: boolean) =>
    `inline-flex min-h-11 items-center justify-center rounded-2xl border px-4 py-2 text-sm font-semibold transition ${active
      ? "border-[var(--accent)] bg-[linear-gradient(135deg,var(--accent),color-mix(in_srgb,var(--accent)_76%,#ec4899_24%))] text-white shadow-[var(--button-shadow-hover)]"
      : "border-[var(--accent)] bg-[linear-gradient(135deg,var(--accent),color-mix(in_srgb,var(--accent)_76%,#ec4899_24%))] text-white shadow-[var(--button-shadow)] hover:-translate-y-0.5 hover:border-[var(--accent)] hover:bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent)_92%,white_8%),color-mix(in_srgb,var(--accent)_72%,#ec4899_28%))] hover:shadow-[var(--button-shadow-hover)]"
    }`;

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 flex min-h-16 min-w-0 items-center justify-between gap-2 border-b border-[var(--border-card)] bg-[color-mix(in_srgb,var(--bg-header)_88%,transparent)] px-3 py-2 shadow-[var(--shadow-header)] backdrop-blur-xl sm:gap-3 sm:px-4 lg:sticky lg:bg-[var(--bg-header)]">
        <div className="flex min-w-0 flex-1 items-center lg:justify-between gap-2">
          {isDashboardHeader ? (
            <button type="button" onClick={onMenuClick} className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--bg-elevated)] text-[var(--text-primary)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] lg:hidden" aria-label={en.common.openMenu} aria-haspopup="true" aria-expanded={mobileNavOpen} aria-controls="dashboard-mobile-navigation"> <Menu size={22} aria-hidden="true" /> </button>
          ) : (
            <button type="button" onClick={() => setMobileNavPath((current) => (current === pathname ? null : pathname))} className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border-card)] bg-[var(--bg-header)] text-[var(--text-primary)] shadow-[var(--button-shadow)] transition hover:border-[var(--accent)] hover:bg-[var(--bg-elevated)] hover:shadow-[var(--button-shadow-hover)] lg:hidden" aria-label={mobileNavOpen ? en.common.closeMenu : en.common.openMenu} aria-expanded={mobileNavOpen} aria-controls="public-mobile-navigation" >
              {mobileNavOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
            </button>
          )}

          {!isDashboardHeader ? (
            <Link href={user ? "/dashboard" : "/"} className="flex min-w-0 items-center gap-2 rounded-2xl">
              <Image src={logo} width={28} height={28} className="h-7 w-7 object-contain" alt={en.common.appName} priority />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{en.common.appName}</p>
                <p className="hidden text-xs text-[var(--text-muted)] sm:block">{en.navigation.workspaceTagline}</p>
              </div>
            </Link>
          ) : null}

          {!isDashboardHeader ? (
            <nav aria-label={en.navigation.mainNavigation} className="ml-3 hidden min-w-0 items-center gap-1 lg:flex">
              {publicNavItems.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href} className={navLinkClass(active)} aria-current={active ? "page" : undefined} >{item.label}</Link>
                );
              })}
            </nav>
          ) : (
            <div className="hidden lg:flex">
              <Link href="/support" className={navLinkClass(pathname === "/support")} aria-current={pathname === "/support" ? "page" : undefined}>
                {en.navigation.support}
              </Link>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-2.5">
          {!isDashboardHeader && authChecked ? (
            <Link href={authAction.href} className={`hidden sm:inline-flex ${actionLinkClass(authAction.active)}`} aria-current={authAction.active ? "page" : undefined}>
              {authAction.label}
            </Link>
          ) : null}

          {/* <LanguageSelector /> */}
          <ThemeToggle />

          {isDashboardHeader ? (
            <div className="relative" ref={accountRef}>
              <button type="button" onClick={() => setAccountMenuPath((current) => (current === pathname ? null : pathname))} className="cursor-pointer flex max-w-[44px] items-center gap-2 rounded-[22px] border border-[var(--border-card)] bg-[var(--bg-header)] py-1 pl-1 pr-1 shadow-[var(--shadow-header)] backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-[var(--accent)] sm:max-w-[220px] sm:pr-3" aria-haspopup="menu" aria-expanded={accountOpen} aria-controls={accountOpen ? accountMenuId : undefined} aria-label={en.common.profile} >
                {user?.photoURL ? (
                  <Image src={user.photoURL} unoptimized referrerPolicy="no-referrer" alt={en.common.profileAlt} width={32} height={32} className="h-8 w-8 rounded-2xl object-cover" />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-[var(--accent-soft)]" aria-hidden="true">
                    <UserIcon size={14} className="text-emerald-600" />
                  </div>
                )}

                <div className="hidden min-w-0 sm:block">
                  <p className="max-w-[110px] truncate text-xs font-semibold text-[var(--text-primary)]">
                    {user?.displayName?.split(" ")[0] || en.common.user}
                  </p>
                </div>
              </button>

              {accountOpen && (
                <div id={accountMenuId} className="absolute right-0 z-50 mt-2 w-[min(18rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] shadow-[var(--shadow-card)] backdrop-blur-xl" role="menu">
                  <div className="border-b border-[var(--border-color)] px-4 py-3">
                    <p className="text-xs text-[var(--text-muted)]">{en.navigation.signedInAs}</p>
                    <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{user?.displayName || user?.email}</p>
                    {user?.displayName ? <p className="truncate text-xs text-[var(--text-muted)]">{user?.email}</p> : null}
                  </div>

                  <Link href="/dashboard/profile" role="menuitem" className="flex w-full items-center gap-3 px-4 py-3 text-sm text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-soft)]" onClick={() => setAccountMenuPath(null)}>
                    <UserIcon size={15} aria-hidden="true" /> {en.common.profile}
                  </Link>
                  <Link href="/dashboard/settings/account" role="menuitem" className="flex w-full items-center gap-3 px-4 py-3 text-sm text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-soft)]" onClick={() => setAccountMenuPath(null)}>
                    <UserCog size={15} aria-hidden="true" /> {en.navigation.accountSettings}
                  </Link>
                  <button type="button" role="menuitem" onClick={handleLogout} className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-sm text-red-500 transition-colors hover:bg-red-500/10">
                    <LogOut size={15} aria-hidden="true" /> {en.common.logout}
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </header>

      {!isDashboardHeader && mobileNavOpen ? (
        <div className="fixed inset-x-0 top-16 z-30 border-b border-[var(--border-card)] bg-[var(--bg-card-strong)] px-3 py-3 shadow-[var(--shadow-card)] backdrop-blur-xl lg:hidden" id="public-mobile-navigation">
          <nav aria-label={en.navigation.mainNavigation} className="flex flex-col gap-2">
            {publicNavItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={navLinkClass(active)}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}

            {authChecked ? (
              <Link href={authAction.href} className={actionLinkClass(authAction.active)} aria-current={authAction.active ? "page" : undefined}>
                {authAction.label}
              </Link>
            ) : null}
          </nav>
        </div>
      ) : null}
    </>
  );
}
