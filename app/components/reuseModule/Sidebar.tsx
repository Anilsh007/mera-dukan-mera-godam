"use client"
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, PlusCircle, BarChart2, Settings, Menu, X } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/stock", label: "Stock", icon: Package },
  { href: "/dashboard/add-product", label: "Add Product", icon: PlusCircle },
];

export default function Sidebar({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (v: boolean) => void }) {
  const pathname = usePathname();

  return (
    <>

      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsOpen(false)} />
      )}

      {/* Sidebar Container */}
      <div className={`border border-gray-700 fixed inset-y-0 z-50 w-64 flex flex-col gap-2 p-2 rounded-xl bg-[var(--bg-sidebar)] shadow-[var(--shadow-card)] lg:static lg:left-0 lg:m-3 ${isOpen ? "activeSidebar m-3" : "deActiveSidebar"} `} >

        <div className="p-4 mb-2 flex justify-between items-center">
          <h1 className="font-bold text-lg">Mera Dukan</h1>
          <button className="lg:hidden" onClick={() => setIsOpen(false)}><X size={20} /></button>
        </div>
        {/* Navigation */}
        <nav className="flex flex-col gap-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;

            return (
              <Link key={href} href={href} onClick={() => setIsOpen(false)} className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200  ${isActive ? "bg-[var(--sidebar-active)] text-white shadow-lg" : "text-[var(--text-secondary)] hover:bg-[var(--sidebar-hover)]"}`}
              >
                <Icon size={18} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />

        <p className="text-center text-[10px] tracking-widest uppercase text-[var(--text-muted)] pb-2">
          v0.1.0 • Mera Dukan
        </p>
      </div>
    </>
  );
}
