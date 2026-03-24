import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Loader2, Edit2, Check, X, Music, BookOpen, User } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useMyProfile, useSaveProfile } from "@/hooks/use-users";
import { useListTunes } from "@/hooks/use-tunes";
import type { UserProfile, Instrument } from "@/bindings/backend/backend";

const INSTRUMENT_OPTIONS: Array<{ value: Instrument["__kind__"]; label: string }> = [
  { value: "fiddle", label: "Fiddle" },
  { value: "flute", label: "Flute" },
  { value: "tinWhistle", label: "Tin Whistle" },
  { value: "uilleannPipes", label: "Uilleann Pipes" },
  { value: "accordion", label: "Accordion" },
  { value: "concertina", label: "Concertina" },
  { value: "bouzouki", label: "Bouzouki" },
  { value: "banjo", label: "Banjo" },
  { value: "guitar", label: "Guitar" },
  { value: "mandolin", label: "Mandolin" },
  { value: "bodhran", label: "Bodhran" },
  { value: "harp", label: "Harp" },
  { value: "vocals", label: "Vocals" },
  { value: "other", label: "Other" },
];

function formatInstrument(inst: Instrument): string {
  if (inst.__kind__ === "other") return inst.other;
  return INSTRUMENT_OPTIONS.find((o) => o.value === inst.__kind__)?.label ?? inst.__kind__;
}

function makeInstrument(kind: string): Instrument {
  if (kind === "other") return { __kind__: "other", other: "Other" };
  return { __kind__: kind as Exclude<Instrument["__kind__"], "other">, [kind]: null } as Instrument;
}

function SetupForm({ onSave }: { onSave: (profile: UserProfile) => Promise<void> }) {
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  function toggleInstrument(kind: string) {
    setSelectedInstruments((prev) =>
      prev.includes(kind) ? prev.filter((k) => k !== kind) : [...prev, kind]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) {
      toast.error("Display name is required");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        displayName: displayName.trim(),
        bio: bio.trim() || undefined,
        photo: undefined,
        location: city.trim() && country.trim() ? { city: city.trim(), country: country.trim() } : undefined,
        instruments: selectedInstruments.map(makeInstrument),
        createdAt: BigInt(Date.now()) * 1_000_000n,
      });
      toast.success("Profile created!");
    } catch {
      toast.error("Failed to create profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="rounded-xl border border-parchment-200 bg-white p-6 shadow-card">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-moss-100 text-moss-700">
            <User size={20} />
          </span>
          <div>
            <h2 className="font-display text-xl font-bold text-stone-900">Set Up Your Profile</h2>
            <p className="text-sm text-stone-500 font-body">Tell us a bit about yourself</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 font-body mb-1">
              Display Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name or handle"
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:border-moss-500 focus:outline-none focus:ring-2 focus:ring-moss-500/20 font-body"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 font-body mb-1">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about your music journey..."
              rows={3}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:border-moss-500 focus:outline-none focus:ring-2 focus:ring-moss-500/20 font-body resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-stone-700 font-body mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Dublin"
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:border-moss-500 focus:outline-none focus:ring-2 focus:ring-moss-500/20 font-body"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 font-body mb-1">Country</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Ireland"
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:border-moss-500 focus:outline-none focus:ring-2 focus:ring-moss-500/20 font-body"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 font-body mb-2">Instruments</label>
            <div className="flex flex-wrap gap-2">
              {INSTRUMENT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleInstrument(opt.value)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium font-body transition-all cursor-pointer",
                    selectedInstruments.includes(opt.value)
                      ? "bg-moss-600 text-white"
                      : "bg-parchment-100 text-stone-600 hover:bg-parchment-200"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" disabled={saving} className="w-full gap-2">
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? "Creating Profile..." : "Create Profile"}
          </Button>
        </form>
      </div>
    </div>
  );
}

function EditableField({
  label,
  value,
  onSave,
  multiline = false,
  placeholder = "",
}: {
  label: string;
  value: string;
  onSave: (val: string) => void;
  multiline?: boolean;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function handleSave() {
    onSave(draft);
    setEditing(false);
  }

  function handleCancel() {
    setDraft(value);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="space-y-1">
        <label className="block text-xs font-medium text-stone-500 font-body uppercase tracking-wide">{label}</label>
        {multiline ? (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 focus:border-moss-500 focus:outline-none focus:ring-2 focus:ring-moss-500/20 font-body resize-none"
          />
        ) : (
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 focus:border-moss-500 focus:outline-none focus:ring-2 focus:ring-moss-500/20 font-body"
          />
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1 rounded-md bg-moss-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-moss-700 transition-colors cursor-pointer"
          >
            <Check size={12} /> Save
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="inline-flex items-center gap-1 rounded-md border border-stone-300 px-2.5 py-1 text-xs font-medium text-stone-600 hover:bg-stone-50 transition-colors cursor-pointer"
          >
            <X size={12} /> Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group space-y-0.5">
      <label className="block text-xs font-medium text-stone-500 font-body uppercase tracking-wide">{label}</label>
      <div className="flex items-start gap-2">
        <p className="flex-1 text-sm text-stone-800 font-body">
          {value || <span className="text-stone-400 italic">{placeholder}</span>}
        </p>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 text-stone-400 hover:text-moss-600 cursor-pointer"
        >
          <Edit2 size={13} />
        </button>
      </div>
    </div>
  );
}

export function ProfilePage() {
  const { data: profile, isLoading } = useMyProfile();
  const { data: tunes } = useListTunes();
  const saveProfile = useSaveProfile();
  const [editingInstruments, setEditingInstruments] = useState(false);
  const [draftInstruments, setDraftInstruments] = useState<string[]>([]);

  async function handleSaveProfile(profile: UserProfile) {
    await saveProfile.mutateAsync(profile);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-moss-500" size={32} />
      </div>
    );
  }

  if (!profile) {
    return <SetupForm onSave={handleSaveProfile} />;
  }

  const p = profile.profile;

  function updateField(patch: Partial<UserProfile>) {
    saveProfile.mutate(
      { ...p, ...patch },
      {
        onError: () => toast.error("Failed to save"),
        onSuccess: () => toast.success("Saved"),
      }
    );
  }

  const knownTunes = tunes?.filter((t) => profile.knownTuneIds.includes(t.id)) ?? [];
  const wishTunes = tunes?.filter((t) => profile.wishListTuneIds.includes(t.id)) ?? [];

  function startEditInstruments() {
    setDraftInstruments(p.instruments.map((i) => i.__kind__));
    setEditingInstruments(true);
  }

  function toggleDraftInstrument(kind: string) {
    setDraftInstruments((prev) =>
      prev.includes(kind) ? prev.filter((k) => k !== kind) : [...prev, kind]
    );
  }

  function saveInstruments() {
    updateField({ instruments: draftInstruments.map(makeInstrument) });
    setEditingInstruments(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-stone-900">My Profile</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column: profile card */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-xl border border-parchment-200 bg-white p-5 shadow-card space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-moss-100 text-moss-700 shrink-0">
                <User size={22} />
              </span>
              <div className="min-w-0 flex-1">
                <EditableField
                  label="Display Name"
                  value={p.displayName}
                  placeholder="Your name"
                  onSave={(v) => updateField({ displayName: v })}
                />
              </div>
            </div>

            <EditableField
              label="Bio"
              value={p.bio ?? ""}
              placeholder="Tell us about yourself"
              multiline
              onSave={(v) => updateField({ bio: v || undefined })}
            />

            <div className="space-y-0.5">
              <label className="block text-xs font-medium text-stone-500 font-body uppercase tracking-wide">
                Location
              </label>
              <div className="grid grid-cols-2 gap-2">
                <EditableField
                  label="City"
                  value={p.location?.city ?? ""}
                  placeholder="City"
                  onSave={(v) =>
                    updateField({
                      location: v ? { city: v, country: p.location?.country ?? "" } : undefined,
                    })
                  }
                />
                <EditableField
                  label="Country"
                  value={p.location?.country ?? ""}
                  placeholder="Country"
                  onSave={(v) =>
                    updateField({
                      location: v ? { city: p.location?.city ?? "", country: v } : undefined,
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-stone-500 font-body uppercase tracking-wide">
                  Instruments
                </label>
                {!editingInstruments && (
                  <button
                    type="button"
                    onClick={startEditInstruments}
                    className="text-stone-400 hover:text-moss-600 transition-colors cursor-pointer"
                  >
                    <Edit2 size={13} />
                  </button>
                )}
              </div>

              {editingInstruments ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {INSTRUMENT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => toggleDraftInstrument(opt.value)}
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-medium font-body transition-all cursor-pointer",
                          draftInstruments.includes(opt.value)
                            ? "bg-moss-600 text-white"
                            : "bg-parchment-100 text-stone-600 hover:bg-parchment-200"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={saveInstruments}
                      className="inline-flex items-center gap-1 rounded-md bg-moss-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-moss-700 transition-colors cursor-pointer"
                    >
                      <Check size={12} /> Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingInstruments(false)}
                      className="inline-flex items-center gap-1 rounded-md border border-stone-300 px-2.5 py-1 text-xs font-medium text-stone-600 hover:bg-stone-50 transition-colors cursor-pointer"
                    >
                      <X size={12} /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {p.instruments.length > 0 ? (
                    p.instruments.map((inst, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-parchment-100 px-2.5 py-0.5 text-xs font-medium text-stone-700 font-body"
                      >
                        {formatInstrument(inst)}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-stone-400 italic font-body">No instruments added</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column: tunebook + wish list */}
        <div className="lg:col-span-2 space-y-4">
          {/* Known tunes */}
          <div className="rounded-xl border border-parchment-200 bg-white p-5 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <Music size={18} className="text-moss-600" />
              <h2 className="font-display text-lg font-semibold text-stone-900">My Tunebook</h2>
              <span className="ml-auto rounded-full bg-parchment-100 px-2 py-0.5 text-xs font-medium text-stone-500 font-body">
                {knownTunes.length}
              </span>
            </div>
            {knownTunes.length === 0 ? (
              <p className="text-sm text-stone-400 italic font-body">
                No tunes marked as known yet.{" "}
                <Link to="/" className="text-moss-600 hover:text-moss-700 not-italic underline">
                  Browse tunes
                </Link>
              </p>
            ) : (
              <ul className="space-y-1">
                {knownTunes.map((tune) => (
                  <li key={tune.id.toString()}>
                    <Link
                      to="/tune/$tuneId"
                      params={{ tuneId: tune.id.toString() }}
                      className="text-sm text-moss-700 hover:text-moss-900 hover:underline font-body"
                    >
                      {tune.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Wish list */}
          <div className="rounded-xl border border-parchment-200 bg-white p-5 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen size={18} className="text-moss-600" />
              <h2 className="font-display text-lg font-semibold text-stone-900">Wish List</h2>
              <span className="ml-auto rounded-full bg-parchment-100 px-2 py-0.5 text-xs font-medium text-stone-500 font-body">
                {wishTunes.length}
              </span>
            </div>
            {wishTunes.length === 0 ? (
              <p className="text-sm text-stone-400 italic font-body">Your wish list is empty.</p>
            ) : (
              <ul className="space-y-1">
                {wishTunes.map((tune) => (
                  <li key={tune.id.toString()}>
                    <Link
                      to="/tune/$tuneId"
                      params={{ tuneId: tune.id.toString() }}
                      className="text-sm text-moss-700 hover:text-moss-900 hover:underline font-body"
                    >
                      {tune.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
