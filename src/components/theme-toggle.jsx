"use client";

import { useEffect, useState } from "react";
import { Moon, SunMedium } from "lucide-react";

import { cn } from "@/lib/utils";

const STORAGE_KEY = "mineral-theme";

function applyTheme(theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

export function ThemeToggle({ className }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") {
      return "dark";
    }

    try {
      const storedTheme = window.localStorage.getItem(STORAGE_KEY);
      if (storedTheme === "light" || storedTheme === "dark") {
        return storedTheme;
      }
    } catch (error) {}

    return document.documentElement.classList.contains("dark")
      ? "dark"
      : "light";
  });

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    try {
      window.localStorage.setItem(STORAGE_KEY, nextTheme);
    } catch (error) {}
    applyTheme(nextTheme);
  };

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      onClick={toggleTheme}
      className={cn(
        "group relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border border-border/70 bg-muted/80 p-1 transition-colors duration-300 ease-out hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-muted/40",
        "data-[checked=true]:bg-foreground/15",
        className
      )}
      data-checked={isDark}
    >
      <span
        className={cn(
          "pointer-events-none flex h-6 w-6 items-center justify-center rounded-full bg-background text-foreground shadow-sm ring-1 ring-black/5 transition-transform duration-300 ease-out dark:ring-white/10",
          isDark ? "translate-x-6" : "translate-x-0"
        )}
      >
        {isDark ? (
          <Moon className="h-3.5 w-3.5" />
        ) : (
          <SunMedium className="h-3.5 w-3.5" />
        )}
      </span>
      <span className="sr-only">
        {isDark ? "Dark mode enabled" : "Light mode enabled"}
      </span>
    </button>
  );
}
