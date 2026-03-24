import { Outlet } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/auth";
import { Nav } from "./nav";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";

export function AppShell() {
  const { logout, principal } = useAuth();

  const truncatedPrincipal = principal
    ? `${principal.slice(0, 5)}...${principal.slice(-3)}`
    : null;

  return (
    <div className="min-h-screen bg-parchment-50 text-stone-900 font-body flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-parchment-300/60 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl flex items-center justify-between h-14 px-4 sm:px-6">
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <span className="font-display text-xl font-bold text-stone-900 tracking-tight">
                Tunebook
              </span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden sm:block">
              <Nav />
            </div>
          </div>

          {/* Right: User info + logout */}
          <div className="flex items-center gap-3">
            <Link
              to="/profile"
              className="hidden sm:flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700 transition-colors"
            >
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-moss-100 text-moss-700">
                <User className="w-3.5 h-3.5" />
              </span>
              <span className="font-mono text-xs">{truncatedPrincipal}</span>
            </Link>

            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              title="Sign out"
              className="text-stone-500 hover:text-stone-700"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="sm:hidden border-t border-parchment-200/60 px-4 py-1">
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
