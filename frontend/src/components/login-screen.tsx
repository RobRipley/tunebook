import { useAuth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Music } from "lucide-react";

export function LoginScreen() {
  const { login, isLoading } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-parchment-50 via-parchment-100 to-parchment-200 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950 px-4 relative overflow-hidden">
      {/* Subtle moss-green radial glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-moss-200/30 dark:bg-moss-900/20 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
      {/* Decorative staff lines */}
      <div className="absolute top-1/4 left-0 right-0 opacity-[0.04] pointer-events-none select-none" aria-hidden="true">
        <div className="max-w-2xl mx-auto flex flex-col gap-[6px]">
          <div className="h-px bg-stone-900 dark:bg-parchment-100" />
          <div className="h-px bg-stone-900 dark:bg-parchment-100" />
          <div className="h-px bg-stone-900 dark:bg-parchment-100" />
          <div className="h-px bg-stone-900 dark:bg-parchment-100" />
          <div className="h-px bg-stone-900 dark:bg-parchment-100" />
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-md">
        {/* Small treble clef accent */}
        <div className="text-moss-400 dark:text-moss-500 mb-6" aria-hidden="true">
          <Music className="w-8 h-8" strokeWidth={1.5} />
        </div>

        {/* Title */}
        <h1 className="font-display text-5xl sm:text-6xl font-bold text-stone-900 dark:text-parchment-50 tracking-tight">
          Tunebook
        </h1>

        {/* Thin decorative rule */}
        <div className="w-16 h-px bg-moss-400 dark:bg-moss-500 mt-4 mb-6" aria-hidden="true" />

        {/* Tagline */}
        <p className="font-body text-lg text-stone-600 dark:text-parchment-200 leading-relaxed mb-10">
          Where traditional musicians connect, share tunes, and find sessions.
        </p>

        {/* Login button */}
        <Button
          size="lg"
          onClick={login}
          disabled={isLoading}
          className="min-w-[280px] text-base"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Initializing...
            </span>
          ) : (
            "Sign in with Internet Identity"
          )}
        </Button>

        {/* Subtle footer */}
        <p className="mt-12 text-sm text-stone-400 dark:text-stone-500 font-body">
          A home for the tradition.
        </p>
      </div>
    </div>
  );
}
