"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";

export function ThemeToggle({ className }) {
  const { resolvedTheme, setTheme } = useTheme();
  const currentTheme = resolvedTheme || "dark";
  const isDark = currentTheme === "dark";

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

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
          <Moon className="h-3.5 w-3.5 text-yellow-400" />
        ) : (
          <Sun className="h-3.5 w-3.5 text-blue-500" />
        )}
      </span>
      <span className="sr-only">
        {isDark ? "Dark mode enabled" : "Light mode enabled"}
      </span>
    </button>
  );
}
