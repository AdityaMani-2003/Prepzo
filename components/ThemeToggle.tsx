"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className={`h-[22px] w-[40px] rounded-[var(--radius-full)] bg-white/10 ${className}`} />
    );
  }

  const isDark = theme === "dark" || resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`
        relative flex h-[22px] w-[40px] items-center rounded-full p-[2px] transition-colors duration-250
        ${isDark ? "bg-[var(--accent)]" : "bg-black/15"}
        ${className}
      `}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <div className="absolute inset-0 flex items-center justify-between px-[5px] pointer-events-none">
         <Sun className={`h-[12px] w-[12px] text-white transition-opacity ${!isDark ? "opacity-100" : "opacity-0"}`} />
         <Moon className={`h-[12px] w-[12px] text-white transition-opacity ${isDark ? "opacity-100" : "opacity-0"}`} />
      </div>

      <span
        className={`
          z-10 h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-transform duration-250 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${isDark ? "translate-x-[18px]" : "translate-x-0"}
        `}
      />
    </button>
  );
}
