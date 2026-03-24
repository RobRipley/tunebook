import { useState } from "react";
import { Check, Circle, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { AbcRenderer } from "@/components/abc-renderer";

type SettingCardProps = {
  setting: {
    id: bigint;
    abcNotation: string;
    submittedBy: { toText: () => string };
    playedBy: Array<{ toText: () => string }>;
    createdAt: bigint;
    editedAt?: bigint | null;
  };
  isCommunityMain: boolean;
  isOwnSetting: boolean;
  isPlayed: boolean;
  onTogglePlay: () => void;
  isToggling?: boolean;
};

type ViewMode = "sheet" | "abc";

function truncatePrincipal(p: string): string {
  if (p.length <= 12) return p;
  return `${p.slice(0, 5)}...${p.slice(-5)}`;
}

function formatDate(nanos: bigint): string {
  const ms = Number(nanos / 1_000_000n);
  return new Date(ms).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function SettingCard({
  setting,
  isCommunityMain,
  isOwnSetting,
  isPlayed,
  onTogglePlay,
  isToggling,
}: SettingCardProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("sheet");
  const playCount = setting.playedBy.length;

  return (
    <div className="rounded-xl border border-parchment-200 dark:border-stone-800 bg-parchment-50 dark:bg-stone-900 p-1.5 shadow-card transition-all duration-200 motion-reduce:transition-none hover:shadow-card-hover">
      {/* Inner card */}
      <div className="rounded-lg border border-parchment-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-4 sm:p-5">
        {/* Metadata line */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 dark:text-stone-400 font-body">
          <span>
            Added by{" "}
            <span className="font-medium text-stone-600 dark:text-stone-300">
              {truncatePrincipal(setting.submittedBy.toText())}
            </span>{" "}
            on {formatDate(setting.createdAt)}
          </span>
          {setting.editedAt && (
            <span className="text-stone-400 dark:text-stone-500">
              (edited {formatDate(setting.editedAt)})
            </span>
          )}
        </div>

        {/* Badges */}
        <div className="mt-2 flex flex-wrap gap-2">
          {isCommunityMain && (
            <span className="inline-flex items-center gap-1 rounded-full bg-moss-100 dark:bg-moss-900 px-2.5 py-0.5 text-xs font-medium text-moss-700 dark:text-moss-400 font-body">
              Community main
            </span>
          )}
          {isOwnSetting && (
            <span className="inline-flex items-center gap-1 rounded-full bg-parchment-200 dark:bg-stone-800 px-2.5 py-0.5 text-xs font-medium text-stone-600 dark:text-stone-300 font-body">
              Your setting
            </span>
          )}
        </div>

        {/* View toggle */}
        <div className="mt-3 inline-flex rounded-full bg-parchment-100 dark:bg-stone-800 p-0.5">
          <button
            type="button"
            onClick={() => setViewMode("sheet")}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium font-body transition-colors motion-reduce:transition-none cursor-pointer",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss-500",
              viewMode === "sheet"
                ? "bg-white dark:bg-stone-700 text-stone-800 dark:text-parchment-100 shadow-sm"
                : "text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
            )}
          >
            Sheet music
          </button>
          <button
            type="button"
            onClick={() => setViewMode("abc")}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium font-body transition-colors motion-reduce:transition-none cursor-pointer",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss-500",
              viewMode === "abc"
                ? "bg-white dark:bg-stone-700 text-stone-800 dark:text-parchment-100 shadow-sm"
                : "text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
            )}
          >
            ABC notation
          </button>
        </div>

        {/* Content area */}
        <div className="mt-3 rounded-lg border border-parchment-100 dark:border-stone-700 bg-parchment-50 dark:bg-stone-800 p-3">
          {viewMode === "sheet" ? (
            <AbcRenderer abc={setting.abcNotation} />
          ) : (
            <pre className="whitespace-pre-wrap break-all font-mono text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
              {setting.abcNotation}
            </pre>
          )}
        </div>

        {/* Play toggle + count */}
        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onTogglePlay}
            disabled={isToggling}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-body font-medium transition-all motion-reduce:transition-none cursor-pointer",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss-500 focus-visible:ring-offset-1",
              isPlayed
                ? "bg-moss-100 dark:bg-moss-900 text-moss-700 dark:text-moss-400 hover:bg-moss-200 dark:hover:bg-moss-800"
                : "border border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-300 hover:bg-parchment-100 dark:hover:bg-stone-800"
            )}
          >
            {isPlayed ? (
              <Check size={16} className="text-moss-600 dark:text-moss-400" />
            ) : (
              <Circle size={16} className="text-stone-400 dark:text-stone-500" />
            )}
            I play this setting
          </button>
          <span className="inline-flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 font-body">
            <Users size={14} />
            {playCount} {playCount === 1 ? "musician plays" : "musicians play"} this
          </span>
        </div>
      </div>
    </div>
  );
}
