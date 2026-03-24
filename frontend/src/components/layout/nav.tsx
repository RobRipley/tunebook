import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Tunes", to: "/" as const },
  { label: "Sessions", to: "/sessions" as const },
  { label: "Friends", to: "/friends" as const },
] as const;

export function Nav() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  return (
    <nav className="flex items-center gap-1">
      {navItems.map((item) => {
        const isActive =
          item.to === "/"
            ? currentPath === "/"
            : currentPath.startsWith(item.to);

        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "px-3 py-2 text-sm font-medium font-body rounded-md transition-colors motion-reduce:transition-none relative",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss-500 focus-visible:ring-offset-2",
              isActive
                ? "text-moss-700 dark:text-moss-400"
                : "text-stone-600 hover:text-stone-900 hover:bg-parchment-100 dark:text-stone-400 dark:hover:text-stone-100 dark:hover:bg-stone-800"
            )}
          >
            {item.label}
            {isActive && (
              <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-moss-500 dark:bg-moss-400 rounded-full" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
