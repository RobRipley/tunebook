import { useState, useMemo, useCallback } from "react";
import { useParams } from "@tanstack/react-router";
import {
  Loader2,
  Plus,
  ArrowLeft,
  BookOpen,
  ChevronUp,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { formatTuneType, formatKey } from "@/lib/abc";
import { Button } from "@/components/ui/button";
import { StarButton } from "@/components/star-button";
import { SettingCard } from "@/components/setting-card";
import { useAuth } from "@/auth";
import {
  useGetTune,
  useStarTune,
  useUnstarTune,
  useAddSetting,
  useMarkPlaySetting,
  useAddAlternateName,
  useUpvoteAlternateName,
} from "@/hooks/use-tunes";

export function TuneDetailPage() {
  const { tuneId } = useParams({ from: "/tune/$tuneId" });
  const navigate = useNavigate();
  const { principal } = useAuth();

  const tuneIdBigInt = useMemo(() => {
    try {
      return BigInt(tuneId);
    } catch {
      return undefined;
    }
  }, [tuneId]);

  const { data: tune, isLoading, isError } = useGetTune(tuneIdBigInt);
  const starTune = useStarTune();
  const unstarTune = useUnstarTune();
  const addSetting = useAddSetting();
  const markPlaySetting = useMarkPlaySetting();
  const addAlternateName = useAddAlternateName();
  const upvoteAlternateName = useUpvoteAlternateName();

  const [showAllNames, setShowAllNames] = useState(false);
  const [addSettingOpen, setAddSettingOpen] = useState(false);
  const [newAbc, setNewAbc] = useState("");
  const [newAltName, setNewAltName] = useState("");

  // Derived state
  const isStarred = useMemo(() => {
    if (!tune || !principal) return false;
    return tune.starredBy.some((p) => {
      if (typeof p === "object" && p !== null && "toText" in p && typeof p.toText === "function") {
        return p.toText() === principal;
      }
      return String(p) === principal;
    });
  }, [tune, principal]);

  const sortedSettings = useMemo(() => {
    if (!tune) return [];
    return [...tune.settings].sort(
      (a, b) => b.playedBy.length - a.playedBy.length
    );
  }, [tune]);

  const mostPlayedCount = useMemo(() => {
    if (sortedSettings.length === 0) return 0;
    return sortedSettings[0].playedBy.length;
  }, [sortedSettings]);

  const handleToggleStar = useCallback(() => {
    if (!tuneIdBigInt) return;
    if (isStarred) {
      unstarTune.mutate(tuneIdBigInt);
    } else {
      starTune.mutate(tuneIdBigInt);
    }
  }, [tuneIdBigInt, isStarred, starTune, unstarTune]);

  const handleTogglePlay = useCallback(
    (settingId: bigint) => {
      if (!tuneIdBigInt) return;
      markPlaySetting.mutate({ tuneId: tuneIdBigInt, settingId });
    },
    [tuneIdBigInt, markPlaySetting]
  );

  const handleAddSetting = useCallback(async () => {
    if (!tuneIdBigInt || !newAbc.trim()) return;
    try {
      await addSetting.mutateAsync({
        tuneId: tuneIdBigInt,
        abcNotation: newAbc.trim(),
      });
      toast.success("Setting added successfully");
      setNewAbc("");
      setAddSettingOpen(false);
    } catch {
      toast.error("Failed to add setting");
    }
  }, [tuneIdBigInt, newAbc, addSetting]);

  const handleAddAltName = useCallback(async () => {
    if (!tuneIdBigInt || !newAltName.trim()) return;
    try {
      await addAlternateName.mutateAsync({
        tuneId: tuneIdBigInt,
        name: newAltName.trim(),
      });
      toast.success("Alternate name proposed");
      setNewAltName("");
    } catch {
      toast.error("Failed to add alternate name");
    }
  }, [tuneIdBigInt, newAltName, addAlternateName]);

  const handleUpvoteName = useCallback(
    (name: string) => {
      if (!tuneIdBigInt) return;
      upvoteAlternateName.mutate({ tuneId: tuneIdBigInt, name });
    },
    [tuneIdBigInt, upvoteAlternateName]
  );

  const isPlayedByCurrent = useCallback(
    (playedBy: Array<{ toText?: () => string } & unknown>) => {
      if (!principal) return false;
      return playedBy.some((p) => {
        if (typeof p === "object" && p !== null && "toText" in p && typeof p.toText === "function") {
          return p.toText() === principal;
        }
        return String(p) === principal;
      });
    },
    [principal]
  );

  const isSubmittedByCurrent = useCallback(
    (submittedBy: { toText?: () => string }) => {
      if (!principal) return false;
      if (typeof submittedBy === "object" && submittedBy !== null && "toText" in submittedBy && typeof submittedBy.toText === "function") {
        return submittedBy.toText() === principal;
      }
      return String(submittedBy) === principal;
    },
    [principal]
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-moss-500" size={32} />
      </div>
    );
  }

  // Error / not found
  if (isError || !tune) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h2 className="font-display text-xl font-bold text-stone-800">
          Tune not found
        </h2>
        <p className="mt-2 text-sm text-stone-500 font-body">
          This tune may have been removed or the ID is invalid.
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate({ to: "/" })}
        >
          <ArrowLeft size={16} />
          Back to Tunes
        </Button>
      </div>
    );
  }

  const tuneTypeKind = tune.tuneType.__kind__;
  const topAltNames = tune.alternateNames.slice(0, 2);
  const hasMoreNames = tune.alternateNames.length > 2;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Back link */}
      <button
        type="button"
        onClick={() => navigate({ to: "/" })}
        className="inline-flex items-center gap-1.5 text-sm text-stone-500 font-body hover:text-stone-700 transition-colors cursor-pointer"
      >
        <ArrowLeft size={14} />
        Back to tunes
      </button>

      {/* ---- Header Section ---- */}
      <div>
        <div className="flex items-start gap-3">
          <StarButton
            starred={isStarred}
            count={tune.starredBy.length}
            onToggle={handleToggleStar}
          />
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-3xl font-bold text-stone-900 leading-tight">
              {tune.title}
            </h1>
            <p className="mt-1 text-base text-stone-600 font-body">
              {formatTuneType(tuneTypeKind)} in {formatKey(tune.key)}
            </p>
          </div>
        </div>

        {/* Stat chips */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-parchment-200 px-3 py-1 text-xs font-medium text-stone-600 font-body">
            <BookOpen size={13} />
            In {tune.starredBy.length}{" "}
            {tune.starredBy.length === 1 ? "tunebook" : "tunebooks"}
          </span>
        </div>

        {/* Also known as (inline preview) */}
        {tune.alternateNames.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-body">
            <span className="text-stone-500">Also known as:</span>
            {topAltNames.map((alt) => (
              <span
                key={alt.name}
                className="inline-block rounded-full bg-parchment-100 border border-parchment-200 px-2.5 py-0.5 text-xs text-stone-600"
              >
                {alt.name}
              </span>
            ))}
            {hasMoreNames && (
              <button
                type="button"
                onClick={() => setShowAllNames(true)}
                className="text-xs text-moss-600 hover:text-moss-700 font-medium cursor-pointer"
              >
                Show all ({tune.alternateNames.length})
              </button>
            )}
          </div>
        )}
      </div>

      {/* ---- Settings Section ---- */}
      <section>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold text-stone-900">
              Settings
            </h2>
            <p className="mt-0.5 text-xs text-stone-500 font-body">
              Different arrangements and transcriptions of this tune
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAddSettingOpen(true)}
            className="gap-1.5"
          >
            <Plus size={14} />
            Add setting
          </Button>
        </div>

        <div className="mt-4 space-y-4">
          {sortedSettings.map((setting) => (
            <SettingCard
              key={setting.id.toString()}
              setting={setting}
              isCommunityMain={
                mostPlayedCount > 0 &&
                setting.playedBy.length === mostPlayedCount &&
                setting.id === sortedSettings[0].id
              }
              isOwnSetting={isSubmittedByCurrent(setting.submittedBy)}
              isPlayed={isPlayedByCurrent(setting.playedBy)}
              onTogglePlay={() => handleTogglePlay(setting.id)}
              isToggling={markPlaySetting.isPending}
            />
          ))}

          {sortedSettings.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-parchment-300 py-12 text-center">
              <p className="text-sm text-stone-500 font-body">
                No settings yet. Be the first to add one.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 gap-1.5"
                onClick={() => setAddSettingOpen(true)}
              >
                <Plus size={14} />
                Add setting
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* ---- Alternate Names Section ---- */}
      <section>
        <h2 className="font-display text-xl font-semibold text-stone-900">
          Alternate Names
        </h2>

        <div className="mt-3 space-y-2">
          {tune.alternateNames.length === 0 && (
            <p className="text-sm text-stone-500 font-body">
              No alternate names have been proposed yet.
            </p>
          )}

          {(showAllNames ? tune.alternateNames : tune.alternateNames).map(
            (alt) => (
              <div
                key={alt.name}
                className="flex items-center justify-between rounded-lg border border-parchment-200 bg-white px-4 py-2.5"
              >
                <span className="text-sm font-medium text-stone-800 font-body">
                  {alt.name}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-stone-500 font-body">
                    {alt.upvotedBy.length}{" "}
                    {alt.upvotedBy.length === 1 ? "upvote" : "upvotes"}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleUpvoteName(alt.name)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium font-body transition-colors cursor-pointer",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss-500",
                      "border border-stone-300 text-stone-600 hover:bg-parchment-100"
                    )}
                  >
                    <ChevronUp size={14} />
                    Upvote
                  </button>
                </div>
              </div>
            )
          )}
        </div>

        {/* Propose new name */}
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={newAltName}
            onChange={(e) => setNewAltName(e.target.value)}
            placeholder="Propose an alternate name..."
            className="flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:border-moss-500 focus:outline-none focus:ring-2 focus:ring-moss-500/20 font-body"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddAltName();
            }}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddAltName}
            disabled={!newAltName.trim() || addAlternateName.isPending}
          >
            {addAlternateName.isPending ? "Adding..." : "Propose"}
          </Button>
        </div>
      </section>

      {/* ---- Add Setting Modal ---- */}
      {addSettingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="relative mx-4 w-full max-w-lg rounded-xl border border-parchment-200 bg-white p-6 shadow-xl">
            <button
              type="button"
              onClick={() => {
                setAddSettingOpen(false);
                setNewAbc("");
              }}
              className="absolute right-4 top-4 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            <h3 className="font-display text-lg font-semibold text-stone-900">
              Add a Setting
            </h3>
            <p className="mt-1 text-sm text-stone-500 font-body">
              Paste ABC notation for this tune.
            </p>

            <textarea
              value={newAbc}
              onChange={(e) => setNewAbc(e.target.value)}
              placeholder={`X:1\nT:${tune.title}\nM:4/4\nK:${tune.key}\n...`}
              rows={10}
              className="mt-4 w-full rounded-lg border border-stone-300 bg-parchment-50 px-3 py-2 font-mono text-sm text-stone-800 placeholder:text-stone-400 focus:border-moss-500 focus:outline-none focus:ring-2 focus:ring-moss-500/20"
            />

            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setAddSettingOpen(false);
                  setNewAbc("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddSetting}
                disabled={!newAbc.trim() || addSetting.isPending}
              >
                {addSetting.isPending ? "Adding..." : "Add Setting"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
