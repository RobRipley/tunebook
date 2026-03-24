import { Outlet } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/auth";
import { Nav } from "./nav";
import { Button } from "@/components/ui/button";
import { LogOut, User, Sun, Moon } from "lucide-react";

function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem("theme");
    if (stored === "dark") return true;
    if (stored === "light") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  return { isDark, toggle: () => setIsDark((d) => !d) };
}

export function AppShell() {
  const { logout, principal } = useAuth();
  const { isDark, toggle } = useDarkMode();

  const truncatedPrincipal = principal
    ? `${principal.slice(0, 5)}...${principal.slice(-3)}`
    : null;

  return (
    <div className="min-h-screen bg-parchment-50 dark:bg-stone-950 text-stone-900 dark:text-parchment-100 font-body flex flex-col transition-colors motion-reduce:transition-none">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-parchment-300/60 dark:border-stone-800 bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl flex items-center justify-between h-14 px-4 sm:px-6">
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className="flex items-center gap-2 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss-500 focus-visible:ring-offset-2 rounded-sm"
            >
              <span className="font-display text-xl font-bold text-stone-900 dark:text-parchment-50 tracking-tight">
                Tunebook
              </span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden sm:block">
              <Nav />
            </div>
          </div>

          {/* Right: Dark mode + User info + logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Dark mode toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              className="text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>

            <Link
              to="/profile"
              className="hidden sm:flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss-500 focus-visible:ring-offset-2 rounded-sm"
            >
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-moss-100 dark:bg-moss-900 text-moss-700 dark:text-moss-400">
                <User className="w-3.5 h-3.5" />
              </span>
              <span className="font-mono text-xs">{truncatedPrincipal}</span>
            </Link>

            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              title="Sign out"
              aria-label="Sign out"
              className="text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="sm:hidden border-t border-parchment-200/60 dark:border-stone-800 px-4 py-1">
          <Nav />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
