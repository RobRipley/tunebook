import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AbcRenderer } from "@/components/abc-renderer";
import { useCreateTune } from "@/hooks/use-tunes";
import { extractTitle, extractTuneType, extractKey, mapTuneType, formatTuneType, formatKey } from "@/lib/abc";
import type { TuneType } from "@/bindings/backend/backend";

const TUNE_TYPES = [
  "reel", "jig", "hornpipe", "slipJig", "polka", "slide", "waltz", "mazurka", "barnDance",
] as const;

const COMMON_KEYS = [
  "Dmaj", "Gmaj", "Amaj", "Emaj", "Bmaj", "Cmaj", "Fmaj",
  "Dmin", "Gmin", "Amin", "Emin", "Bmin",
  "Ddor", "Edor", "Ador",
  "Dmix", "Gmix", "Amix",
];

function makeTuneType(kind: string): TuneType {
  if (kind === "other") {
    return { __kind__: "other", other: "" } as TuneType;
  }
  return { __kind__: kind, [kind]: null } as unknown as TuneType;
}

type AddTuneDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function AddTuneDialog({ open, onClose }: AddTuneDialogProps) {
  const navigate = useNavigate();
  const createTune = useCreateTune();

  const [abc, setAbc] = useState("");
  const [title, setTitle] = useState("");
  const [tuneTypeKind, setTuneTypeKind] = useState("");
  const [key, setKey] = useState("");

  // Auto-extract fields from ABC
  useEffect(() => {
    if (!abc) return;
    const extracted = extractTitle(abc);
    if (extracted) setTitle(extracted);

    const extractedType = extractTuneType(abc);
    if (extractedType) setTuneTypeKind(mapTuneType(extractedType));

    const extractedKey = extractKey(abc);
    if (extractedKey) setKey(extractedKey);
  }, [abc]);

  const handleSubmit = useCallback(async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!tuneTypeKind) {
      toast.error("Please select a tune type");
      return;
    }
    if (!key.trim()) {
      toast.error("Key is required");
      return;
    }
    if (!abc.trim()) {
      toast.error("ABC notation is required");
      return;
    }

    try {
      const result = await createTune.mutateAsync({
        title: title.trim(),
        abcNotation: abc.trim(),
        tuneType: makeTuneType(tuneTypeKind),
        key: key.trim(),
      });
      toast.success(`"${title.trim()}" added to your tunebook`);
      onClose();
      setAbc("");
      setTitle("");
      setTuneTypeKind("");
      setKey("");
      navigate({ to: "/tune/$tuneId", params: { tuneId: result.id.toString() } });
    } catch {
      toast.error("Failed to create tune. Please try again.");
    }
  }, [title, tuneTypeKind, key, abc, createTune, onClose, navigate]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative z-10 mx-4 w-full max-w-2xl rounded-xl border border-parchment-200 bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-parchment-200 px-6 py-4">
          <h2 className="font-display text-xl font-semibold text-stone-900">Add a Tune</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-stone-400 hover:bg-parchment-100 hover:text-stone-600 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-5 px-6 py-5">
          {/* ABC Notation */}
          <div>
            <label htmlFor="abc-input" className="block text-sm font-medium text-stone-700 font-body mb-1.5">
              ABC Notation
            </label>
            <textarea
              id="abc-input"
              value={abc}
              onChange={(e) => setAbc(e.target.value)}
              rows={8}
              placeholder={"X:1\nT:The Kesh Jig\nR:jig\nM:6/8\nK:Gmaj\n|:GAG GAB|ABA ABd|edd gdd|edB dBA|..."}
              className="w-full rounded-lg border border-stone-300 bg-parchment-50 px-3 py-2 font-mono text-sm text-stone-800 placeholder:text-stone-400 focus:border-moss-500 focus:outline-none focus:ring-2 focus:ring-moss-500/20 resize-y"
            />
          </div>

          {/* Preview */}
          {abc.trim() && (
            <div className="rounded-lg border border-parchment-200 bg-parchment-50 p-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-stone-400 font-body">Preview</p>
              <AbcRenderer abc={abc} preview />
            </div>
          )}

          {/* Auto-extracted fields */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Title */}
            <div className="sm:col-span-3">
              <label htmlFor="tune-title" className="block text-sm font-medium text-stone-700 font-body mb-1.5">
                Title
              </label>
              <input
                id="tune-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Tune title"
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:border-moss-500 focus:outline-none focus:ring-2 focus:ring-moss-500/20 font-body"
              />
            </div>

            {/* Tune Type */}
            <div>
              <label htmlFor="tune-type" className="block text-sm font-medium text-stone-700 font-body mb-1.5">
                Type
              </label>
              <select
                id="tune-type"
                value={tuneTypeKind}
                onChange={(e) => setTuneTypeKind(e.target.value)}
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 focus:border-moss-500 focus:outline-none focus:ring-2 focus:ring-moss-500/20 font-body cursor-pointer"
              >
                <option value="">Select type...</option>
                {TUNE_TYPES.map((t) => (
                  <option key={t} value={t}>{formatTuneType(t)}</option>
                ))}
              </select>
            </div>

            {/* Key */}
            <div>
              <label htmlFor="tune-key" className="block text-sm font-medium text-stone-700 font-body mb-1.5">
                Key
              </label>
              <select
                id="tune-key"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 focus:border-moss-500 focus:outline-none focus:ring-2 focus:ring-moss-500/20 font-body cursor-pointer"
              >
                <option value="">Select key...</option>
                {COMMON_KEYS.map((k) => (
                  <option key={k} value={k}>{formatKey(k)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-parchment-200 px-6 py-4">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createTune.isPending || !title.trim() || !tuneTypeKind || !key || !abc.trim()}
          >
            {createTune.isPending ? "Saving..." : "Add Tune"}
          </Button>
        </div>
      </div>
    </div>
  );
}
