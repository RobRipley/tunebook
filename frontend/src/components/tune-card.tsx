import { useNavigate } from "@tanstack/react-router";
import { Music } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTuneType, formatKey } from "@/lib/abc";
import { AbcRenderer } from "@/components/abc-renderer";
import { StarButton } from "@/components/star-button";
import type { Tune } from "@/bindings/backend/backend";

type TuneCardProps = {
  tune: Tune;
  starred: boolean;
  onToggleStar: () => void;
};

export function TuneCard({ tune, starred, onToggleStar }: TuneCardProps) {
  const navigate = useNavigate();
  const firstAbc = tune.settings[0]?.abcNotation;
  const tuneTypeLabel = formatTuneType(tune.tuneType.__kind__);
  const keyLabel = tune.key ? formatKey(tune.key) : null;

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => navigate({ to: "/tune/$tuneId", params: { tuneId: tune.id.toString() } })}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate({ to: "/tune/$tuneId", params: { tuneId: tune.id.toString() } });
        }
      }}
      className={cn(
        "group relative rounded-lg border border-parchment-200 bg-white p-4 shadow-card cursor-pointer",
        "transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss-500 focus-visible:ring-offset-2"
      )}
    >
      {/* Header: Star + Title + Badge */}
      <div className="flex items-start gap-2">
        <StarButton
          starred={starred}
          count={tune.starredBy.length}
          onToggle={onToggleStar}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-base font-semibold text-stone-900 leading-snug truncate">
            {tune.title}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="inline-block rounded-full bg-parchment-200 px-2.5 py-0.5 text-xs font-medium text-stone-600 font-body">
              {tuneTypeLabel}
            </span>
            {keyLabel && (
              <span className="text-xs text-stone-500 font-body">{keyLabel}</span>
            )}
          </div>
        </div>
      </div>

      {/* ABC Preview */}
      {firstAbc && (
        <div className="mt-3 overflow-hidden rounded border border-parchment-100 bg-parchment-50 px-2 py-1">
          <AbcRenderer abc={firstAbc} preview />
        </div>
      )}

      {/* Footer metadata */}
      <div className="mt-3 flex items-center gap-3 text-xs text-stone-400 font-body">
        {tune.settings.length > 0 && (
          <span className="inline-flex items-center gap-1">
            <Music size={12} />
            {tune.settings.length} {tune.settings.length === 1 ? "setting" : "settings"}
          </span>
        )}
        {tune.thesessionId !== undefined && tune.thesessionId !== null && (
          <span className="text-stone-300">TheSession #{tune.thesessionId.toString()}</span>
        )}
      </div>
    </div>
  );
}
