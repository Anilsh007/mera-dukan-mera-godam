"use client";

import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext({
  theme: "light",
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof document !== "undefined") {
      const domTheme = document.documentElement.getAttribute("data-theme");
      if (domTheme) return domTheme;
    }
    if (typeof window === "undefined") return "light";
    const saved = localStorage.getItem("mdmg-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return saved || (prefersDark ? "dark" : "light");
  });

  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem("mdmg-theme", t);
  }

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
  };

  // ✅ HAMESHA Provider ke andar render Add at least one purchase item. — mounted guard hata diya
  // Pehle mounted check ki wajah se context nahi milta tha useTheme() ko
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
