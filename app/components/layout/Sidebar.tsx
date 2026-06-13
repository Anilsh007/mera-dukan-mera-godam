"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

import logo from "@/assets/logo.webp";
import { en } from "@/app/messages/en";
import { sidebarNavItems, type SidebarNavChild, type SidebarNavItem } from "./sidebarNav";

const isRouteMatch = (pathname: string, href?: string) => {
  if (!href) return false;
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
};

const getActiveMenuIds = (pathname: string) =>
  sidebarNavItems
    .filter((item) => item.children?.some((child) => isRouteMatch(pathname, child.href)))
    .map((item) => item.id);

function SidebarLink({
  item,
  pathname,
  isCollapsed,
  isMobile,
  onNavigate,
}: {
  item: SidebarNavItem;
  pathname: string;
  isCollapsed: boolean;
  isMobile: boolean;
  onNavigate: () => void;
}) {
  const Icon = item.icon;
  const active = isRouteMatch(pathname, item.href);
  const showLabel = !isCollapsed || isMobile;

  return (
    <Link
      href={item.href!}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      aria-label={item.label}
      title={!showLabel ? item.label : undefined}
      className={`flex min-h-11 items-center gap-3 rounded-xl p-1 transition hover:-translate-y-0.5 active:scale-[0.99] ${
        active
          ? "bg-[linear-gradient(135deg,var(--sidebar-active),var(--accent-secondary,#8b5cf6))] text-white shadow-[var(--button-shadow-hover)]"
          : "text-[var(--text-primary)] hover:border-[var(--border-card)] hover:bg-[linear-gradient(135deg,var(--sidebar-hover),transparent)] hover:shadow-[var(--button-shadow)]"
      }`}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-xl">
        <Icon size={18} aria-hidden="true" />
      </div>
      {showLabel && <span className="text-sm font-medium">{item.label}</span>}
    </Link>
  );
}

function SidebarChildLink({
  child,
  pathname,
  onNavigate,
}: {
  child: SidebarNavChild;
  pathname: string;
  onNavigate: () => void;
}) {
  const ChildIcon = child.icon;
  const active = isRouteMatch(pathname, child.href);

  return (
    <Link
      href={child.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      aria-label={child.label}
      className={`flex min-h-10 items-center gap-3 rounded-xl p-2.5 text-sm transition ${
        active
          ? "bg-[linear-gradient(135deg,var(--sidebar-active),var(--accent-secondary,#8b5cf6))] font-medium text-white shadow-[var(--button-shadow-hover)]"
          : "border-transparent text-[var(--text-primary)] hover:border-[var(--border-card)] hover:bg-[linear-gradient(135deg,var(--sidebar-hover),transparent)] hover:text-[var(--text-primary)] hover:shadow-[var(--button-shadow)]"
      }`}
    >
      {ChildIcon && <ChildIcon size={15} aria-hidden="true" />}
      <span>{child.label}</span>
    </Link>
  );
}

function SidebarGroup({
  item,
  pathname,
  isCollapsed,
  isMobile,
  isOpen,
  onToggle,
  onNavigate,
}: {
  item: SidebarNavItem;
  pathname: string;
  isCollapsed: boolean;
  isMobile: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onNavigate: () => void;
}) {
  const Icon = item.icon;
  const parentActive = item.children?.some((child) => isRouteMatch(pathname, child.href)) ?? false;
  const showLabel = !isCollapsed || isMobile;
  const canShowChildren = showLabel && isOpen;
  const groupId = `sidebar-group-${item.id}`;

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={showLabel ? isOpen : false}
        aria-controls={groupId}
        aria-label={item.label}
        title={!showLabel ? item.label : undefined}
        className={`flex min-h-11 w-full items-center justify-between rounded-xl p-1 text-left transition hover:-translate-y-0.5 active:scale-[0.99] ${
          parentActive
            ? "bg-[linear-gradient(135deg,var(--sidebar-active),var(--accent-secondary,#8b5cf6))] text-white shadow-[var(--button-shadow-hover)]"
            : "border-transparent text-[var(--text-primary)] hover:border-[var(--border-card)] hover:bg-[linear-gradient(135deg,var(--sidebar-hover),transparent)] hover:shadow-[var(--button-shadow)]"
        }`}
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
            <Icon size={18} aria-hidden="true" />
          </span>
          {showLabel && <span className="truncate text-sm font-medium">{item.label}</span>}
        </span>

        {showLabel &&
          (isOpen ? <ChevronDown size={16} aria-hidden="true" /> : <ChevronRight size={16} aria-hidden="true" />)}
      </button>

      <div id={groupId} hidden={!canShowChildren} className="mt-2 ml-3 space-y-1 border-l border-[var(--border-color)] pl-1">
        {item.children?.map((child) => (
          <SidebarChildLink key={child.id} child={child} pathname={pathname} onNavigate={onNavigate} />
        ))}
      </div>
    </div>
  );
}

export default function Sidebar({
  isOpen,
  setIsOpen,
  isCollapsed,
  setIsCollapsed,
}: {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean | ((prev: boolean) => boolean)) => void;
}) {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const activeMenuIds = useMemo(() => getActiveMenuIds(pathname), [pathname]);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);

      if (mobile) {
        setIsCollapsed(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setIsCollapsed]);


  useEffect(() => {
    if (!isMobile || !isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMobile, isOpen, setIsOpen]);

  const handleSidebarToggle = () => {
    if (isMobile) {
      setIsOpen(false);
      return;
    }

    setIsCollapsed((prev) => !prev);
  };

  const handleNavigate = () => {
    if (isMobile) setIsOpen(false);
  };

  const toggleSubmenu = (key: string) => {
    if (isCollapsed && !isMobile) {
      setIsCollapsed(false);
      setOpenMenus((prev) => ({
        ...prev,
        [key]: true,
      }));
      return;
    }

    setOpenMenus((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <>
      {isOpen && isMobile && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/45 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
          aria-label={en.common.closeMenu}
        />
      )}

      <aside
        aria-label={en.common.tagLine}
        className={`sidebar-shell fixed top-0 left-0 border border-[var(--border-color)] bg-[var(--bg-sidebar)] shadow-[var(--shadow-card)] backdrop-blur-xl flex h-[100dvh] flex-col p-1 transition-all duration-300 shrink-0 ${
          isMobile
            ? `fixed inset-y-0 left-0 z-50 m-2 ${isOpen ? "translate-x-0" : "-translate-x-[120%]"} w-[min(88vw,260px)] rounded-[24px]`
            : `inset-y-0 z-40 ${isCollapsed ? "w-12" : "w-[228px]"}`
        }`}
      >
        <div className="relative mb-2 flex items-center justify-start px-2">
          <div className="flex w-full items-center justify-center border-b border-[var(--border-color)] pb-3">
            <Image src={logo} width={28} height={28} className="h-7 w-7 object-contain" alt={en.common.appName} priority />
            {(!isCollapsed || isMobile) && (
              <div className="ml-2 hidden min-w-0 flex-col items-start sm:flex">
                <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{en.common.appName}</p>
                <p className="hidden text-[11px] text-[var(--text-muted)] sm:block">{en.common.tagLine}</p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleSidebarToggle}
            className="hidden lg:flex items-center justify-center w-8 h-8 rounded-full absolute top-[49dvh] right-[-21px] -translate-y-1/2 shadow-[var(--button-shadow)] cursor-pointer border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-2 text-[var(--text-primary)] transition hover:scale-[1.03] hover:border-[var(--accent)] hover:bg-[var(--bg-elevated)] hover:shadow-[var(--button-shadow-hover)]"
            aria-label={en.common.collapseSidebar}
          >
            <ChevronLeft size={20} aria-hidden="true" className={`transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`} />
          </button>
        </div>

        <nav className="flex min-w-0 flex-1 flex-col gap-1 overflow-y-auto pr-1" aria-label={en.navigation.mainNavigation}>
          {sidebarNavItems.map((item) =>
            item.children?.length ? (
              <SidebarGroup
                key={item.id}
                item={item}
                pathname={pathname}
                isCollapsed={isCollapsed}
                isMobile={isMobile}
                isOpen={openMenus[item.id] ?? activeMenuIds.includes(item.id)}
                onToggle={() => toggleSubmenu(item.id)}
                onNavigate={handleNavigate}
              />
            ) : (
              <SidebarLink
                key={item.id}
                item={item}
                pathname={pathname}
                isCollapsed={isCollapsed}
                isMobile={isMobile}
                onNavigate={handleNavigate}
              />
            ),
          )}
        </nav>
      </aside>
    </>
  );
}
