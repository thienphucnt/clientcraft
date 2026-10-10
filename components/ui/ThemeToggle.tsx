"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/lib/theme-provider";

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50 animate-pulse" />
    );
  }

  return (
    <div
      className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl"
      title={`Active theme: ${theme} (resolved: ${resolvedTheme})`}
    >
      <button
        onClick={() => setTheme("light")}
        aria-label="Light mode"
        className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
          theme === "light"
            ? "bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100"
            : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
        }`}
      >
        <Sun className="w-4 h-4" />
      </button>

      <button
        onClick={() => setTheme("dark")}
        aria-label="Dark mode"
        className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
          theme === "dark"
            ? "bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100"
            : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
        }`}
      >
        <Moon className="w-4 h-4" />
      </button>

      <button
        onClick={() => setTheme("system")}
        aria-label="System theme"
        className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
          theme === "system"
            ? "bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100"
            : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
        }`}
      >
        <Monitor className="w-4 h-4" />
      </button>
    </div>
  );
}
