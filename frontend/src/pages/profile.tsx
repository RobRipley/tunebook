import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  Loader2,
  Edit2,
  Check,
  X,
  Music,
  BookOpen,
  User,
  Users,
  Star,
  MapPin,
  Plus,
  ListMusic,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useMyProfile, useSaveProfile } from "@/hooks/use-users";
import { useListTunes } from "@/hooks/use-tunes";
import { useMyFriends } from "@/hooks/use-social";
import { formatTuneType } from "@/lib/abc";
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
];

function formatInstrument(inst: Instrument): string {
  if (inst.__kind__ === "other") return inst.other;
  return INSTRUMENT_OPTIONS.find((o) => o.value === inst.__kind__)?.label ?? inst.__kind__;
}

function makeInstrument(kind: string, customName?: string): Instrument {
  if (kind === "other") return { __kind__: "other", other: customName ?? "Other" };
  return { __kind__: kind as Exclude<Instrument["__kind__"], "other">, [kind]: null } as Instrument;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const inputClass =
  "w-full rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-sm text-stone-800 dark:text-stone-200 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:border-moss-500 focus:outline-none focus:ring-2 focus:ring-moss-500/20 font-body";

/* ------------------------------------------------------------------ */
/*  Instrument picker with custom "other" support                     */
/* ------------------------------------------------------------------ */

function InstrumentPicker({
  selected,
  customOthers,
  onToggle,
  onAddCustom,
  onRemoveCustom,
  onUpdateCustom,
}: {
  selected: string[];
  customOthers: string[];
  onToggle: (kind: string) => void;
  onAddCustom: () => void;
  onRemoveCustom: (index: number) => void;
  onUpdateCustom: (index: number, value: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {INSTRUMENT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onToggle(opt.value)}
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-medium font-body transition-all motion-reduce:transition-none cursor-pointer",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss-500",
              selected.includes(opt.value)
                ? "bg-moss-600 dark:bg-moss-700 text-white"
                : "bg-parchment-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-parchment-200 dark:hover:bg-stone-700"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Custom instruments */}
      {customOthers.length > 0 && (
        <div className="space-y-2">
          {customOthers.map((name, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => onUpdateCustom(idx, e.target.value)}
                placeholder="Instrument name..."
                className={`${inputClass} flex-1`}
              />
              <button
                type="button"
                onClick={() => onRemoveCustom(idx)}
                className="text-stone-400 hover:text-red-500 dark:text-stone-500 dark:hover:text-red-400 transition-colors cursor-pointer"
                aria-label="Remove custom instrument"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={onAddCustom}
        className="inline-flex items-center gap-1 text-xs text-moss-600 dark:text-moss-400 hover:text-moss-700 dark:hover:text-moss-300 font-medium font-body cursor-pointer"
      >
        <Plus size={12} />
        Add another instrument
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Setup form (first-time user)                                      */
/* ------------------------------------------------------------------ */

function SetupForm({ onSave }: { onSave: (profile: UserProfile) => Promise<void> }) {
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);
  const [customOthers, setCustomOthers] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  function toggleInstrument(kind: string) {
    setSelectedInstruments((prev) =>
      prev.includes(kind) ? prev.filter((k) => k !== kind) : [...prev, kind]
    );
  }

  function buildInstruments(): Instrument[] {
    const standard = selectedInstruments.map((k) => makeInstrument(k));
    const customs = customOthers
      .filter((n) => n.trim())
      .map((n) => makeInstrument("other", n.trim()));
    return [...standard, ...customs];
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
        location:
          city.trim() && country.trim()
            ? { city: city.trim(), country: country.trim() }
            : undefined,
        instruments: buildInstruments(),
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
      <div className="rounded-xl border border-parchment-200 dark:border-stone-700 border-l-4 border-l-moss-500 bg-white dark:bg-stone-900 p-6 shadow-card">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-moss-100 dark:bg-moss-900 text-moss-700 dark:text-moss-400">
            <User size={20} />
          </span>
          <div>
            <h2 className="font-display text-xl font-bold text-stone-900 dark:text-parchment-50">
              Set Up Your Profile
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 font-body">
              Tell us a bit about yourself
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 font-body mb-1">
              Display Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name or handle"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 font-body mb-1">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about your music journey..."
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 font-body mb-1">
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Dublin"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 font-body mb-1">
                Country
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Ireland"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 font-body mb-2">
              Instruments
            </label>
            <InstrumentPicker
              selected={selectedInstruments}
              customOthers={customOthers}
              onToggle={toggleInstrument}
              onAddCustom={() => setCustomOthers((prev) => [...prev, ""])}
              onRemoveCustom={(i) => setCustomOthers((prev) => prev.filter((_, idx) => idx !== i))}
              onUpdateCustom={(i, v) =>
                setCustomOthers((prev) => prev.map((cur, idx) => (idx === i ? v : cur)))
              }
            />
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

/* ------------------------------------------------------------------ */
/*  Editable field                                                    */
/* ------------------------------------------------------------------ */

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
        <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 font-body uppercase tracking-wide">
          {label}
        </label>
        {multiline ? (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            className={`${inputClass} resize-none`}
          />
        ) : (
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className={inputClass}
          />
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1 rounded-md bg-moss-600 dark:bg-moss-700 px-2.5 py-1 text-xs font-medium text-white hover:bg-moss-700 dark:hover:bg-moss-600 transition-colors motion-reduce:transition-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss-500"
          >
            <Check size={12} /> Save
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="inline-flex items-center gap-1 rounded-md border border-stone-300 dark:border-stone-600 px-2.5 py-1 text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors motion-reduce:transition-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss-500"
          >
            <X size={12} /> Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group space-y-0.5">
      <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 font-body uppercase tracking-wide">
        {label}
      </label>
      <div className="flex items-start gap-2">
        <p className="flex-1 text-sm text-stone-800 dark:text-stone-200 font-body">
          {value || (
            <span className="text-stone-400 dark:text-stone-500 italic">{placeholder}</span>
          )}
        </p>
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label={`Edit ${label}`}
          className="opacity-0 group-hover:opacity-100 transition-opacity motion-reduce:transition-none mt-0.5 text-stone-400 dark:text-stone-500 hover:text-moss-600 dark:hover:text-moss-400 cursor-pointer focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss-500 rounded-sm"
        >
          <Edit2 size={13} />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Stat card                                                         */
/* ------------------------------------------------------------------ */

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border border-parchment-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-4 shadow-card text-center">
      <div className="flex items-center justify-center text-moss-500 dark:text-moss-400 mb-1">
        {icon}
      </div>
      <p className="font-display text-2xl font-bold text-moss-700 dark:text-moss-400">{value}</p>
      <p className="text-xs text-stone-500 dark:text-stone-400 font-body">{label}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section header                                                    */
/* ------------------------------------------------------------------ */

function SectionHeader({
  icon,
  title,
  count,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  count?: number;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-moss-200 dark:border-moss-800">
      <span className="text-moss-600 dark:text-moss-400">{icon}</span>
      <h2 className="font-display text-lg font-semibold text-stone-900 dark:text-parchment-50">
        {title}
      </h2>
      {count !== undefined && (
        <span className="rounded-full bg-parchment-100 dark:bg-stone-800 px-2 py-0.5 text-xs font-medium text-stone-500 dark:text-stone-400 font-body">
          {count}
        </span>
      )}
      {action && <div className="ml-auto">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main profile page                                                 */
/* ------------------------------------------------------------------ */

export function ProfilePage() {
  const { data: profile, isLoading } = useMyProfile();
  const { data: tunes } = useListTunes();
  const { data: friends } = useMyFriends();
  const saveProfile = useSaveProfile();

  const [editingInstruments, setEditingInstruments] = useState(false);
  const [draftInstruments, setDraftInstruments] = useState<string[]>([]);
  const [draftCustomOthers, setDraftCustomOthers] = useState<string[]>([]);

  async function handleSaveProfile(p: UserProfile) {
    await saveProfile.mutateAsync(p);
  }

  // Popular tunes across the site (sorted by star count)
  const popularTunes = useMemo(() => {
    if (!tunes) return [];
    return [...tunes]
      .sort((a, b) => b.starredBy.length - a.starredBy.length)
      .filter((t) => t.starredBy.length > 0)
      .slice(0, 5);
  }, [tunes]);

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
  const friendCount = friends?.length ?? 0;

  function startEditInstruments() {
    // Separate standard instruments from custom "other" ones
    const standard = p.instruments
      .filter((i) => i.__kind__ !== "other")
      .map((i) => i.__kind__);
    const customs = p.instruments
      .filter((i) => i.__kind__ === "other")
      .map((i) => i.other);
    setDraftInstruments(standard);
    setDraftCustomOthers(customs);
    setEditingInstruments(true);
  }

  function toggleDraftInstrument(kind: string) {
    setDraftInstruments((prev) =>
      prev.includes(kind) ? prev.filter((k) => k !== kind) : [...prev, kind]
    );
  }

  function saveInstruments() {
    const standard = draftInstruments.map((k) => makeInstrument(k));
    const customs = draftCustomOthers
      .filter((n) => n.trim())
      .map((n) => makeInstrument("other", n.trim()));
    updateField({ instruments: [...standard, ...customs] });
    setEditingInstruments(false);
  }

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="rounded-xl bg-gradient-to-r from-moss-50 via-parchment-50 to-parchment-50 dark:from-moss-950 dark:via-stone-900 dark:to-stone-900 border border-moss-200 dark:border-moss-800 p-6 shadow-card">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full ring-2 ring-moss-400 dark:ring-moss-600 bg-moss-100 dark:bg-moss-900 text-moss-700 dark:text-moss-400 shrink-0">
            <User size={28} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-900 dark:text-parchment-50">
              {getGreeting()}, {p.displayName}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-stone-500 dark:text-stone-400 font-body">
              {p.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={13} className="text-moss-500 dark:text-moss-400" />
                  {p.location.city}, {p.location.country}
                </span>
              )}
              {p.instruments.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {p.instruments.map((inst, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-moss-100 dark:bg-moss-900/50 border border-moss-200 dark:border-moss-800 px-2 py-0.5 text-xs font-medium text-moss-700 dark:text-moss-400 font-body"
                    >
                      {formatInstrument(inst)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={<Music size={18} />}
          label="Tunes Known"
          value={knownTunes.length}
        />
        <StatCard
          icon={<ListMusic size={18} />}
          label="Wish List"
          value={wishTunes.length}
        />
        <StatCard
          icon={<Users size={18} />}
          label="Friends"
          value={friendCount}
        />
        <StatCard
          icon={<Star size={18} />}
          label="Starred"
          value={
            tunes?.filter((t) =>
              t.starredBy.some((sp) => {
                const spText = typeof sp === "object" && sp !== null && "toText" in sp && typeof sp.toText === "function" ? sp.toText() : String(sp);
                return spText === profile.principal?.toText?.();
              })
            ).length ?? 0
          }
        />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column: content sections */}
        <div className="lg:col-span-2 space-y-5">
          {/* Popular on Tunebook */}
          {popularTunes.length > 0 && (
            <div className="rounded-xl border border-parchment-200 dark:border-stone-700 border-l-4 border-l-moss-400 dark:border-l-moss-600 bg-white dark:bg-stone-900 p-5 shadow-card">
              <SectionHeader
                icon={<Star size={18} />}
                title="Popular on Tunebook"
              />
              <ul className="space-y-2">
                {popularTunes.map((tune) => (
                  <li key={tune.id.toString()} className="flex items-center justify-between">
                    <Link
                      to="/tune/$tuneId"
                      params={{ tuneId: tune.id.toString() }}
                      className="text-sm text-moss-700 dark:text-moss-400 hover:text-moss-900 dark:hover:text-moss-300 hover:underline font-body truncate"
                    >
                      {tune.title}
                    </Link>
                    <div className="flex items-center gap-1 text-xs text-stone-400 dark:text-stone-500 font-body shrink-0 ml-2">
                      <Star size={12} className="text-amber-400" />
                      {tune.starredBy.length}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* My Tunebook */}
          <div className="rounded-xl border border-parchment-200 dark:border-stone-700 border-l-4 border-l-moss-400 dark:border-l-moss-600 bg-white dark:bg-stone-900 p-5 shadow-card">
            <SectionHeader
              icon={<Music size={18} />}
              title="My Tunebook"
              count={knownTunes.length}
              action={
                <Link
                  to="/"
                  className="text-xs text-moss-600 dark:text-moss-400 hover:text-moss-700 dark:hover:text-moss-300 font-body hover:underline"
                >
                  Browse more tunes
                </Link>
              }
            />
            {knownTunes.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-center">
                <Music className="mb-2 text-moss-400 dark:text-moss-600" size={32} />
                <p className="text-sm text-stone-400 dark:text-stone-500 italic font-body">
                  No tunes marked as known yet.{" "}
                  <Link
                    to="/"
                    className="text-moss-600 dark:text-moss-400 hover:text-moss-700 dark:hover:text-moss-300 not-italic underline"
                  >
                    Browse tunes
                  </Link>
                </p>
              </div>
            ) : (
              <ul className="space-y-1.5">
                {knownTunes.map((tune) => (
                  <li key={tune.id.toString()} className="flex items-center gap-2">
                    <Link
                      to="/tune/$tuneId"
                      params={{ tuneId: tune.id.toString() }}
                      className="text-sm text-moss-700 dark:text-moss-400 hover:text-moss-900 dark:hover:text-moss-300 hover:underline font-body truncate"
                    >
                      {tune.title}
                    </Link>
                    <span className="rounded-full bg-parchment-200 dark:bg-stone-800 px-2 py-0.5 text-[10px] font-medium text-stone-500 dark:text-stone-400 font-body shrink-0">
                      {formatTuneType(tune.tuneType.__kind__)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Wish List */}
          <div className="rounded-xl border border-parchment-200 dark:border-stone-700 border-l-4 border-l-moss-400 dark:border-l-moss-600 bg-white dark:bg-stone-900 p-5 shadow-card">
            <SectionHeader
              icon={<BookOpen size={18} />}
              title="Wish List"
              count={wishTunes.length}
            />
            {wishTunes.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-center">
                <BookOpen className="mb-2 text-moss-400 dark:text-moss-600" size={32} />
                <p className="text-sm text-stone-400 dark:text-stone-500 italic font-body">
                  Your wish list is empty.
                </p>
              </div>
            ) : (
              <ul className="space-y-1.5">
                {wishTunes.map((tune) => (
                  <li key={tune.id.toString()} className="flex items-center gap-2">
                    <Link
                      to="/tune/$tuneId"
                      params={{ tuneId: tune.id.toString() }}
                      className="text-sm text-moss-700 dark:text-moss-400 hover:text-moss-900 dark:hover:text-moss-300 hover:underline font-body truncate"
                    >
                      {tune.title}
                    </Link>
                    <span className="rounded-full bg-parchment-200 dark:bg-stone-800 px-2 py-0.5 text-[10px] font-medium text-stone-500 dark:text-stone-400 font-body shrink-0">
                      {formatTuneType(tune.tuneType.__kind__)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right column: profile info card */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-xl border border-parchment-200 dark:border-stone-700 border-l-4 border-l-moss-400 dark:border-l-moss-600 bg-white dark:bg-stone-900 p-5 shadow-card space-y-4">
            {/* Avatar + name */}
            <div className="flex flex-col items-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full ring-3 ring-moss-400 dark:ring-moss-600 bg-moss-100 dark:bg-moss-900 text-moss-700 dark:text-moss-400 mb-3">
                <User size={36} />
              </div>
              <h2 className="font-display text-lg font-bold text-stone-900 dark:text-parchment-50">
                {p.displayName}
              </h2>
              {p.location && (
                <p className="text-sm text-stone-500 dark:text-stone-400 font-body inline-flex items-center gap-1 mt-0.5">
                  <MapPin size={12} className="text-moss-500" />
                  {p.location.city}, {p.location.country}
                </p>
              )}
            </div>

            <div className="border-t border-parchment-200 dark:border-stone-700 pt-4 space-y-3">
              <EditableField
                label="Display Name"
                value={p.displayName}
                placeholder="Your name"
                onSave={(v) => updateField({ displayName: v })}
              />

              <EditableField
                label="Bio"
                value={p.bio ?? ""}
                placeholder="Tell us about yourself"
                multiline
                onSave={(v) => updateField({ bio: v || undefined })}
              />

              <div className="space-y-0.5">
                <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 font-body uppercase tracking-wide">
                  Location
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <EditableField
                    label="City"
                    value={p.location?.city ?? ""}
                    placeholder="City"
                    onSave={(v) =>
                      updateField({
                        location: v
                          ? { city: v, country: p.location?.country ?? "" }
                          : undefined,
                      })
                    }
                  />
                  <EditableField
                    label="Country"
                    value={p.location?.country ?? ""}
                    placeholder="Country"
                    onSave={(v) =>
                      updateField({
                        location: v
                          ? { city: p.location?.city ?? "", country: v }
                          : undefined,
                      })
                    }
                  />
                </div>
              </div>

              {/* Instruments with custom "other" support */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 font-body uppercase tracking-wide">
                    Instruments
                  </label>
                  {!editingInstruments && (
                    <button
                      type="button"
                      onClick={startEditInstruments}
                      aria-label="Edit instruments"
                      className="text-stone-400 dark:text-stone-500 hover:text-moss-600 dark:hover:text-moss-400 transition-colors motion-reduce:transition-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss-500 rounded-sm"
                    >
                      <Edit2 size={13} />
                    </button>
                  )}
                </div>

                {editingInstruments ? (
                  <div className="space-y-3">
                    <InstrumentPicker
                      selected={draftInstruments}
                      customOthers={draftCustomOthers}
                      onToggle={toggleDraftInstrument}
                      onAddCustom={() => setDraftCustomOthers((prev) => [...prev, ""])}
                      onRemoveCustom={(i) =>
                        setDraftCustomOthers((prev) => prev.filter((_, idx) => idx !== i))
                      }
                      onUpdateCustom={(i, v) =>
                        setDraftCustomOthers((prev) =>
                          prev.map((cur, idx) => (idx === i ? v : cur))
                        )
                      }
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={saveInstruments}
                        className="inline-flex items-center gap-1 rounded-md bg-moss-600 dark:bg-moss-700 px-2.5 py-1 text-xs font-medium text-white hover:bg-moss-700 dark:hover:bg-moss-600 transition-colors motion-reduce:transition-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss-500"
                      >
                        <Check size={12} /> Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingInstruments(false)}
                        className="inline-flex items-center gap-1 rounded-md border border-stone-300 dark:border-stone-600 px-2.5 py-1 text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors motion-reduce:transition-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss-500"
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
                          className="rounded-full bg-parchment-100 dark:bg-stone-800 px-2.5 py-0.5 text-xs font-medium text-stone-700 dark:text-stone-300 font-body"
                        >
                          {formatInstrument(inst)}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-stone-400 dark:text-stone-500 italic font-body">
                        No instruments added
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
