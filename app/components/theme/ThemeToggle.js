"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "./ThemeProvider";
import { Sun, Moon } from "lucide-react";
import { en } from "@/app/messages/en";

const emptySubscribe = () => () => {};

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const isDark = theme === "dark";

  return (
    <button type="button" onClick={toggleTheme} aria-label={en.common.toggleTheme} aria-pressed={mounted ? isDark : undefined} className=" relative flex h-10 w-10 items-center justify-center gap-2 rounded-full border border-[var(--border-color)] bg-[var(--toggle-bg)] p-2 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer" >
      {mounted ? (isDark ? <Sun size={15} aria-hidden="true" /> : <Moon size={15} aria-hidden="true" />) : <span className="h-[15px] w-[15px]" aria-hidden="true" />}
    </button>
  );
}
