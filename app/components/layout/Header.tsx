"use client";

import { useState, useEffect, useRef } from "react";
import { signOut, onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/app/lib/firebase";
import ThemeToggle from "@/app/components/theme/ThemeToggle";
import Link from "next/link";
import { LogOut, Menu, User as UserIcon } from "lucide-react";
import logo from "@/assets/logo.svg";
import { en } from "@/app/messages/en";

export default function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
  }, []);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex min-w-0 flex-wrap items-center justify-between gap-2 border-b border-[var(--border-card)] bg-[color-mix(in_srgb,var(--bg-header)_88%,transparent)] px-3 py-2 shadow-[var(--shadow-header)] backdrop-blur-xl sm:flex-nowrap sm:gap-3 sm:px-4 lg:sticky lg:bg-[var(--bg-header)]">

      <div className="flex min-w-0 items-center justify-center">
        <button onClick={onMenuClick} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--bg-elevated)] text-[var(--text-primary)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] lg:hidden"
          aria-label={en.common.openMenu} >
          <Menu size={22} />
        </button>
        <div className="flex min-w-0 items-center justify-center lg:hidden">
          <img src={logo.src} className="h-7 w-7 object-contain" alt={en.common.appName} />
          <div className="ml-2 hidden min-w-0 flex-col items-start sm:flex">
            <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{en.common.appName}</p>
            <p className="hidden text-xs text-[var(--text-muted)] md:block">{en.nav.workspaceTagline}</p>
          </div>
        </div>
      </div>




      <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
        {/* <div className="hidden items-center gap-2 rounded-[22px] border border-[var(--border-card)] bg-[var(--bg-header)] px-3 py-2 text-sm text-[var(--text-muted)] shadow-[var(--shadow-header)] backdrop-blur-xl xl:flex">
          <Search size={15} />
          <span>Track stock, sales, and GST</span>
        </div>

        <button className="hidden h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border-card)] bg-[var(--bg-header)] text-[var(--text-secondary)] shadow-[var(--shadow-header)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:text-[var(--text-primary)] lg:inline-flex">
          <Bell size={16} />
        </button> */}

        <ThemeToggle />

        <div className="relative" ref={ref}>
          <button onClick={() => setOpen((current) => !current)}
            className="cursor-pointer flex max-w-[122px] items-center gap-2 rounded-[22px] border border-[var(--border-card)] bg-[var(--bg-header)] py-1 pl-1 pr-2 shadow-[var(--shadow-header)] backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-[var(--accent)] sm:max-w-[220px] sm:pr-3" >
            {user?.photoURL ? (
              <img src={user.photoURL} referrerPolicy="no-referrer" alt="Profile" className="h-8 w-8 rounded-2xl object-cover" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-[var(--accent-soft)]">
                <UserIcon size={14} className="text-emerald-600" />
              </div>
            )}

            <div className="hidden min-w-0 sm:block">
              <p className="max-w-[110px] truncate text-xs font-semibold text-[var(--text-primary)]">
                {user?.displayName?.split(" ")[0] || en.common.user}
              </p>
            </div>
          </button>

          {open && (
            <div className="absolute right-0 z-50 mt-2 w-[min(18rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] shadow-[var(--shadow-card)] backdrop-blur-xl">
              <div className="border-b border-[var(--border-color)] px-4 py-3">
                <p className="text-xs text-[var(--text-muted)]">{en.nav.signedInAs}</p>
                <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{user?.displayName || user?.email}</p>
                {user?.displayName && <p className="truncate text-xs text-[var(--text-muted)]">{user?.email}</p>}
              </div>

              <Link href="/dashboard/profile" className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-soft)]">
                <UserIcon size={15} /> {en.common.profile}
              </Link>
              <button onClick={handleLogout} className="w-full cursor-pointer flex items-center gap-3 px-4 py-3 text-sm text-red-500 transition-colors hover:bg-red-500/10">
                <LogOut size={15} /> {en.common.logout}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
