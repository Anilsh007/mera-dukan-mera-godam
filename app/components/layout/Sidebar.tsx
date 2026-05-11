"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, PlusCircle, ChevronLeft, Settings, ChevronDown, ChevronRight, Download, SlidersHorizontal, History, TriangleAlert, Truck, BarChart3, ShoppingCart, type LucideIcon, } from "lucide-react";
import logo from "@/assets/logo.svg";
import { en } from "@/app/messages/en";

type NavItem = {
  href?: string;
  label: string;
  icon: LucideIcon;
  children?: {
    href: string;
    label: string;
    icon?: LucideIcon;
  }[];
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: en.nav.overview, icon: LayoutDashboard },
  { href: "/dashboard/add-product", label: en.nav.quickPurchase, icon: PlusCircle },
  { href: "/dashboard/purchases", label: en.nav.purchases, icon: ShoppingCart },
  { href: "/dashboard/all-stock", label: en.nav.inventory, icon: Package },
  { href: "/dashboard/stock-history", label: en.nav.stockHistory, icon: History },
  { href: "/dashboard/expiry-alerts", label: en.nav.expiryAlerts, icon: TriangleAlert },
  { href: "/dashboard/suppliers", label: en.nav.suppliers, icon: Truck },
  { href: "/dashboard/gst-invoice", label: en.nav.gstInvoice, icon: SlidersHorizontal },
  { href: "/dashboard/reports", label: en.nav.reports, icon: BarChart3 },
  {
    label: en.nav.settings,
    icon: Settings,
    children: [{ href: "/dashboard/settings/download", label: en.nav.downloadData, icon: Download }],
  },
];

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
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    [en.nav.settings]: true,
  });

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);

      // Mobile drawer should always open in expanded mode for readability.
      if (mobile) {
        setIsCollapsed(false);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setIsCollapsed]);

  const handleSidebarToggle = () => {
    if (isMobile) setIsOpen(false);
    else setIsCollapsed((prev) => !prev);
  };

  const toggleSubmenu = (key: string) => {
    if (isCollapsed && !isMobile) return;
    setOpenMenus((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const isActive = (href?: string) => !!href && pathname === href;

  const isChildRoute = (href?: string) => {
    if (!href) return false;
    if (href === "/dashboard") return false;
    return pathname.startsWith(`${href}/`) && pathname !== href;
  };

  const hasActiveChild = (item: NavItem) =>
    item.children?.some((child) => pathname === child.href) ?? false;

  return (
    <>
      {isOpen && isMobile && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setIsOpen(false)} />
      )}

      <aside className={`fixed top-0 left-0 border border-[var(--border-color)] bg-[var(--bg-sidebar)] shadow-[var(--shadow-card)] backdrop-blur-xl flex h-[100dvh] flex-col p-1 transition-all duration-300 shrink-0 ${isMobile
        ? `fixed inset-y-0 left-0 z-50 m-2 ${isOpen ? "translate-x-0" : "-translate-x-[120%]"} w-[min(88vw,260px)] rounded-[24px]`
        : `inset-y-0 z-40 ${isCollapsed ? "w-12" : "w-[228px]"}`
        }`}
      >
        <div className="relative mb-2 flex items-center justify-start px-2">

          <div className="flex items-center justify-center border-b border-[var(--border-color)] pb-3 w-full">
            <img src={logo.src} className="h-7 w-7 object-contain" alt={en.common.appName} />
            {(!isCollapsed || isMobile) && (
              <div className="ml-2 hidden min-w-0 flex-col items-start sm:flex">
                <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{en.common.appName}</p>
                <p className="hidden text-[11px] text-[var(--text-muted)] sm:block">{en.nav.workspaceTagline}</p>
              </div>
            )}
          </div>


          <button onClick={handleSidebarToggle} className="hidden lg:flex items-center justify-center w-8 h-8 rounded-full absolute top-[49dvh] right-[-21px] -translate-y-1/2 shadow-[var(--shadow-card)] cursor-pointer border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-2 text-[var(--text-primary)] transition hover:border-[var(--accent)] hover:bg-[var(--bg-elevated)]" aria-label={en.common.collapseSidebar} >
            <ChevronLeft size={20} className={`transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`} />
          </button>
        </div>

        <nav className="flex flex-1 min-w-0 flex-col overflow-y-auto pr-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const menuOpen =
              item.label === en.nav.settings && pathname.startsWith("/dashboard/settings")
                ? true
                : openMenus[item.label] || false;
            const parentActive = hasActiveChild(item);

            if (item.children?.length) {
              return (
                <div key={item.label}>
                  <button type="button" onClick={() => toggleSubmenu(item.label)} className={`flex w-full items-center justify-between rounded-xl p-1 transition ${parentActive ? "bg-[var(--sidebar-active)] text-white shadow-[var(--shadow-card)]" : "text-[var(--text-primary)] hover:bg-[var(--sidebar-hover)]"}`} >
                    <div className="flex items-center gap-2">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${(isActive(item.href) || isChildRoute(item.href)) ? "" : ""}`}>
                        <Icon size={18} />
                      </div>
                      {(!isCollapsed || isMobile) && <span className="text-sm font-medium">{item.label}</span>}
                    </div>

                    {(!isCollapsed || isMobile) && (menuOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
                  </button>

                  {(!isCollapsed || isMobile) && menuOpen && (
                    <div className="mt-2 ml-3 border-l border-[var(--border-color)] pl-1">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;

                        return (
                          <Link key={child.href} href={child.href} onClick={() => isMobile && setIsOpen(false)} className={`flex items-center gap-3 rounded-xl p-3 text-sm transition ${pathname === child.href
                            ? "bg-[var(--sidebar-active)] font-medium text-white shadow-[var(--shadow-card)]"
                            : "text-[var(--text-primary)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--text-primary)]"
                            }`} >
                            {ChildIcon && <ChildIcon size={15} />}
                            <span>{child.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link key={item.href} href={item.href!} onClick={() => isMobile && setIsOpen(false)} className={`flex items-center gap-3 rounded-xl p-1 transition ${isActive(item.href) || isChildRoute(item.href)
                ? "bg-[var(--sidebar-active)] text-white shadow-[var(--shadow-card)]"
                : "text-[var(--text-primary)] hover:bg-[var(--sidebar-hover)]"
                }`} >
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${(isActive(item.href) || isChildRoute(item.href)) ? "" : ""}`}>
                  <Icon size={18} />
                </div>
                {(!isCollapsed || isMobile) && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
