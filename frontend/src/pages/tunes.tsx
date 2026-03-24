import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, Plus, Music, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatKey } from "@/lib/abc";
import { Button } from "@/components/ui/button";
import { TuneCard } from "@/components/tune-card";
import { AddTuneDialog } from "@/components/add-tune-dialog";
import { AbcRenderer } from "@/components/abc-renderer";
import { useAuth } from "@/auth";
import {
  useListTunes,
  useStarTune,
  useUnstarTune,
  useSearchThesession,
  useImportThesessionTune,
} from "@/hooks/use-tunes";
import type { TuneType } from "@/bindings/backend/backend";

const TUNE_TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "reel", label: "Reel" },
  { value: "jig", label: "Jig" },
  { value: "hornpipe", label: "Hornpipe" },
  { value: "slipJig", label: "Slip Jig" },
  { value: "polka", label: "Polka" },
  { value: "slide", label: "Slide" },
  { value: "waltz", label: "Waltz" },
  { value: "mazurka", label: "Mazurka" },
  { value: "barnDance", label: "Barn Dance" },
];

const KEY_OPTIONS = [
  { value: "", label: "All Keys" },
  { value: "D", label: "D Major" },
  { value: "G", label: "G Major" },
  { value: "A", label: "A Major" },
  { value: "E", label: "E Major" },
  { value: "B", label: "B Major" },
  { value: "C", label: "C Major" },
  { value: "F", label: "F Major" },
  { value: "Dm", label: "D Minor" },
  { value: "Am", label: "A Minor" },
  { value: "Em", label: "E Minor" },
];

type Tab = "tunebook" | "thesession";

export function TunesPage() {
  const { principal } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("tunebook");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [keyFilter, setKeyFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  // Data hooks
  const { data: tunes, isLoading: tunesLoading } = useListTunes();
  const starTune = useStarTune();
  const unstarTune = useUnstarTune();

  // TheSession search
  const [sessionSearch, setSessionSearch] = useState("");
  const [sessionTypeFilter, setSessionTypeFilter] = useState("");
  const { data: sessionResults, isLoading: sessionLoading } = useSearchThesession(sessionSearch, sessionTypeFilter || undefined);
  const importTune = useImportThesessionTune();

  // Is this tune starred by the current user?
  const isStarred = useCallback(
    (starredBy: Array<{ toText?: () => string } & unknown>) => {
      if (!principal) return false;
      return starredBy.some((p) => {
        if (typeof p === "object" && p !== null && "toText" in p && typeof p.toText === "function") {
          return p.toText() === principal;
        }
        return String(p) === principal;
      });
    },
    [principal]
  );

  // Filtered tunes for tunebook tab
  const filteredTunes = useMemo(() => {
    if (!tunes) return [];
    return tunes.filter((tune) => {
      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = tune.title.toLowerCase().includes(q);
        const matchesAlt = tune.alternateNames.some((an) =>
          an.name.toLowerCase().includes(q)
        );
        if (!matchesTitle && !matchesAlt) return false;
      }
      // Type filter
      if (typeFilter && tune.tuneType.__kind__ !== typeFilter) return false;
      // Key filter
      if (keyFilter && !tune.key.toLowerCase().startsWith(keyFilter.toLowerCase())) return false;
      return true;
    });
  }, [tunes, searchQuery, typeFilter, keyFilter]);

  const handleToggleStar = useCallback(
    (tuneId: bigint, currentlyStarred: boolean) => {
      if (currentlyStarred) {
        unstarTune.mutate(tuneId);
      } else {
        starTune.mutate(tuneId);
      }
    },
    [starTune, unstarTune]
  );

  function makeTuneType(kind: string): TuneType {
    if (kind === "other") {
      return { __kind__: "other", other: "" } as TuneType;
    }
    return { __kind__: kind, [kind]: null } as unknown as TuneType;
  }

  const handleImportTune = useCallback(
    async (tune: { id: number; name: string; type: string; settings?: Array<{ key: string; abc: string }> }) => {
      const firstSetting = tune.settings?.[0];
      if (!firstSetting) {
        toast.error("No settings available for this tune");
        return;
      }
      try {
        const result = await importTune.mutateAsync({
          thesessionId: BigInt(tune.id),
          title: tune.name,
          abcNotation: firstSetting.abc,
          tuneType: makeTuneType(tune.type.toLowerCase()),
          key: firstSetting.key,
        });
        toast.success(`"${tune.name}" imported to your tunebook`);
        navigate({ to: "/tune/$tuneId", params: { tuneId: result.id.toString() } });
      } catch {
        toast.error("Failed to import tune");
      }
    },
    [importTune, navigate]
  );

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-stone-900">Tunes</h1>
          <p className="mt-1 text-sm text-stone-500 font-body">
            Browse, search, and build your collection of traditional tunes.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2 self-start">
          <Plus size={16} />
          Add a Tune
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-parchment-200">
        <nav className="-mb-px flex gap-6" aria-label="Tabs">
          <button
            type="button"
            onClick={() => setActiveTab("tunebook")}
            className={cn(
              "pb-3 text-sm font-medium font-body transition-colors border-b-2 cursor-pointer",
              activeTab === "tunebook"
                ? "border-moss-600 text-moss-700"
                : "border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300"
            )}
          >
            Tunebook
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("thesession")}
            className={cn(
              "pb-3 text-sm font-medium font-body transition-colors border-b-2 cursor-pointer inline-flex items-center gap-1.5",
              activeTab === "thesession"
                ? "border-moss-600 text-moss-700"
                : "border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300"
            )}
          >
            TheSession.org
            <ExternalLink size={12} />
          </button>
        </nav>
      </div>

      {/* Tunebook Tab */}
      {activeTab === "tunebook" && (
        <div className="space-y-5">
          {/* Search + Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tunes..."
                className="w-full rounded-lg border border-stone-300 bg-white py-2 pl-9 pr-3 text-sm text-stone-800 placeholder:text-stone-400 focus:border-moss-500 focus:outline-none focus:ring-2 focus:ring-moss-500/20 font-body"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 focus:border-moss-500 focus:outline-none focus:ring-2 focus:ring-moss-500/20 font-body cursor-pointer"
            >
              {TUNE_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select
              value={keyFilter}
              onChange={(e) => setKeyFilter(e.target.value)}
              className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 focus:border-moss-500 focus:outline-none focus:ring-2 focus:ring-moss-500/20 font-body cursor-pointer"
            >
              {KEY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Loading */}
          {tunesLoading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="animate-spin text-moss-500" size={32} />
            </div>
          )}

          {/* Empty state */}
          {!tunesLoading && filteredTunes.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-parchment-300 py-16 text-center">
              <Music className="mb-3 text-stone-300" size={40} />
              <h3 className="font-display text-lg font-semibold text-stone-700">
                {searchQuery || typeFilter || keyFilter
                  ? "No tunes match your search"
                  : "Your tunebook is empty"}
              </h3>
              <p className="mt-1 max-w-sm text-sm text-stone-500 font-body">
                {searchQuery || typeFilter || keyFilter
                  ? "Try adjusting your filters or search terms."
                  : "Start building your collection by adding a tune or searching TheSession.org."}
              </p>
              {!searchQuery && !typeFilter && !keyFilter && (
                <Button onClick={() => setDialogOpen(true)} className="mt-4 gap-2" size="sm">
                  <Plus size={14} />
                  Add Your First Tune
                </Button>
              )}
            </div>
          )}

          {/* Tune grid */}
          {!tunesLoading && filteredTunes.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTunes.map((tune) => {
                const starred = isStarred(tune.starredBy);
                return (
                  <TuneCard
                    key={tune.id.toString()}
                    tune={tune}
                    starred={starred}
                    onToggleStar={() => handleToggleStar(tune.id, starred)}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TheSession Tab */}
      {activeTab === "thesession" && (
        <div className="space-y-5">
          {/* Session Search */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
              <input
                type="text"
                value={sessionSearch}
                onChange={(e) => setSessionSearch(e.target.value)}
                placeholder="Search TheSession.org..."
                className="w-full rounded-lg border border-stone-300 bg-white py-2 pl-9 pr-3 text-sm text-stone-800 placeholder:text-stone-400 focus:border-moss-500 focus:outline-none focus:ring-2 focus:ring-moss-500/20 font-body"
              />
            </div>
            <select
              value={sessionTypeFilter}
              onChange={(e) => setSessionTypeFilter(e.target.value)}
              className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 focus:border-moss-500 focus:outline-none focus:ring-2 focus:ring-moss-500/20 font-body cursor-pointer"
            >
              {TUNE_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Loading */}
          {sessionLoading && sessionSearch.length > 1 && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="animate-spin text-moss-500" size={32} />
            </div>
          )}

          {/* Empty / initial state */}
          {!sessionLoading && !sessionResults?.tunes?.length && (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-parchment-300 py-16 text-center">
              <Search className="mb-3 text-stone-300" size={40} />
              <h3 className="font-display text-lg font-semibold text-stone-700">
                {sessionSearch.length > 1 ? "No results found" : "Search TheSession.org"}
              </h3>
              <p className="mt-1 max-w-sm text-sm text-stone-500 font-body">
                {sessionSearch.length > 1
                  ? "Try different search terms or tune type."
                  : "Find tunes from the world's largest collection of traditional music."}
              </p>
            </div>
          )}

          {/* Results */}
          {sessionResults?.tunes?.length > 0 && (
            <div className="space-y-3">
              {sessionResults.tunes.map((tune: { id: number; name: string; type: string; settings?: Array<{ key: string; abc: string }> }) => (
                <div
                  key={tune.id}
                  className="rounded-lg border border-parchment-200 bg-white p-4 shadow-card transition-all duration-200 hover:shadow-card-hover"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display text-base font-semibold text-stone-900">
                        {tune.name}
                      </h3>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="inline-block rounded-full bg-parchment-200 px-2.5 py-0.5 text-xs font-medium text-stone-600 font-body capitalize">
                          {tune.type}
                        </span>
                        {tune.settings?.[0]?.key && (
                          <span className="text-xs text-stone-500 font-body">
                            {formatKey(tune.settings[0].key)}
                          </span>
                        )}
                        <span className="text-xs text-stone-400 font-body">
                          #{tune.id}
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleImportTune(tune)}
                      disabled={importTune.isPending}
                      className="shrink-0"
                    >
                      {importTune.isPending ? "Importing..." : "Import"}
                    </Button>
                  </div>
                  {tune.settings?.[0]?.abc && (
                    <div className="mt-3 overflow-hidden rounded border border-parchment-100 bg-parchment-50 px-2 py-1">
                      <AbcRenderer abc={tune.settings[0].abc} preview />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Tune Dialog */}
      <AddTuneDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
