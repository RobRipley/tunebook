import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, Plus, MapPin, Users, Calendar, Lock, Unlock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StarButton } from "@/components/star-button";
import { useAuth } from "@/auth";
import { useListSessions, useCreateSession, useStarSession } from "@/hooks/use-sessions";
import { SessionFrequency, DifficultyLevel } from "@/bindings/backend/backend";
import type { MusicSession, Location } from "@/bindings/backend/backend";

function difficultyLabel(d: DifficultyLevel): string {
  switch (d) {
    case DifficultyLevel.beginner: return "Beginner";
    case DifficultyLevel.intermediate: return "Intermediate";
    case DifficultyLevel.advanced: return "Advanced";
    case DifficultyLevel.allLevels: return "All Levels";
    default: return d;
  }
}

function difficultyColor(d: DifficultyLevel): string {
  switch (d) {
    case DifficultyLevel.beginner: return "bg-emerald-100 text-emerald-700";
    case DifficultyLevel.intermediate: return "bg-amber-100 text-amber-700";
    case DifficultyLevel.advanced: return "bg-red-100 text-red-700";
    case DifficultyLevel.allLevels: return "bg-parchment-200 text-stone-700";
    default: return "bg-parchment-200 text-stone-700";
  }
}

function frequencyLabel(f: SessionFrequency): string {
  switch (f) {
    case SessionFrequency.weekly: return "Weekly";
    case SessionFrequency.biweekly: return "Bi-weekly";
    case SessionFrequency.monthly: return "Monthly";
    case SessionFrequency.irregular: return "Irregular";
    default: return f;
  }
}

function SessionCard({
  session,
  onStar,
  starred,
}: {
  session: MusicSession;
  onStar: () => void;
  starred: boolean;
}) {
  const navigate = useNavigate();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate({ to: "/session/$sessionId", params: { sessionId: session.id.toString() } })}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          navigate({ to: "/session/$sessionId", params: { sessionId: session.id.toString() } });
        }
      }}
      className="rounded-xl border border-parchment-200 bg-white p-4 shadow-card transition-all duration-200 hover:shadow-card-hover cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-base font-semibold text-stone-900 truncate">{session.name}</h3>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-stone-500 font-body">
            <MapPin size={11} />
            <span>{session.location.city}, {session.location.country}</span>
          </div>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium font-body",
            difficultyColor(session.difficulty)
          )}
        >
          {difficultyLabel(session.difficulty)}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-3 flex-wrap">
        <span className="inline-flex items-center gap-1 text-xs text-stone-500 font-body">
          <Calendar size={11} />
          {frequencyLabel(session.frequency)}
        </span>
        <span className="inline-flex items-center gap-1 text-xs text-stone-500 font-body">
          {session.isOpen ? <Unlock size={11} /> : <Lock size={11} />}
          {session.isOpen ? "Open" : "Closed"}
        </span>
        <span className="inline-flex items-center gap-1 text-xs text-stone-500 font-body">
          <Users size={11} />
          {session.attendees.length}
        </span>
      </div>

      {session.description && (
        <p className="mt-2 text-xs text-stone-500 font-body line-clamp-2">{session.description}</p>
      )}

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-stone-400 font-body">{session.time}</span>
        <div onClick={(e) => e.stopPropagation()}>
          <StarButton
            starred={starred}
            count={session.starredBy.length}
            onToggle={onStar}
            size="sm"
          />
        </div>
      </div>
    </div>
  );
}

function CreateSessionModal({ onClose }: { onClose: () => void }) {
  const createSession = useCreateSession();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [time, setTime] = useState("");
  const [frequency, setFrequency] = useState<SessionFrequency>(SessionFrequency.weekly);
  const [isOpen, setIsOpen] = useState(true);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(DifficultyLevel.allLevels);
  const [description, setDescription] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !city.trim() || !country.trim()) {
      toast.error("Name, city, and country are required");
      return;
    }
    try {
      const location: Location = { city: city.trim(), country: country.trim() };
      await createSession.mutateAsync({
        name: name.trim(),
        location,
        time: time.trim(),
        frequency,
        isOpen,
        difficulty,
        description: description.trim(),
      });
      toast.success("Session created!");
      onClose();
    } catch {
      toast.error("Failed to create session");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-parchment-200 bg-white p-6 shadow-xl">
        <h2 className="font-display text-xl font-bold text-stone-900 mb-5">Create a Session</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 font-body mb-1">Session Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="The Cobblestone Session"
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:border-moss-500 focus:outline-none focus:ring-2 focus:ring-moss-500/20 font-body"
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
            <label className="block text-sm font-medium text-stone-700 font-body mb-1">Time / Schedule</label>
            <input
              type="text"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder="Thursdays 9pm"
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:border-moss-500 focus:outline-none focus:ring-2 focus:ring-moss-500/20 font-body"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-stone-700 font-body mb-1">Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as SessionFrequency)}
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 focus:border-moss-500 focus:outline-none focus:ring-2 focus:ring-moss-500/20 font-body cursor-pointer"
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
                <option value="irregular">Irregular</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 font-body mb-1">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 focus:border-moss-500 focus:outline-none focus:ring-2 focus:ring-moss-500/20 font-body cursor-pointer"
              >
                <option value="allLevels">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={isOpen}
                onChange={(e) => setIsOpen(e.target.checked)}
                className="sr-only peer"
              />
              <div className="h-5 w-9 rounded-full bg-stone-200 peer-checked:bg-moss-600 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-4" />
            </label>
            <span className="text-sm font-medium text-stone-700 font-body">Open session</span>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 font-body mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A welcoming session for all traditional music lovers..."
              rows={3}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:border-moss-500 focus:outline-none focus:ring-2 focus:ring-moss-500/20 font-body resize-none"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createSession.isPending} className="flex-1 gap-2">
              {createSession.isPending && <Loader2 size={14} className="animate-spin" />}
              {createSession.isPending ? "Creating..." : "Create Session"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function SessionsPage() {
  const { principal } = useAuth();
  const { data: sessions, isLoading } = useListSessions();
  const starSession = useStarSession();
  const [createOpen, setCreateOpen] = useState(false);

  function isStarred(session: MusicSession): boolean {
    if (!principal) return false;
    return session.starredBy.some((p) => {
      if (typeof p === "object" && p !== null && "toText" in p && typeof (p as { toText?: () => string }).toText === "function") {
        return (p as { toText: () => string }).toText() === principal;
      }
      return String(p) === principal;
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-stone-900">Sessions</h1>
          <p className="mt-1 text-sm text-stone-500 font-body">
            Find and join traditional music sessions near you.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2 self-start">
          <Plus size={16} />
          Create Session
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-moss-500" size={32} />
        </div>
      )}

      {!isLoading && (!sessions || sessions.length === 0) && (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-parchment-300 py-16 text-center">
          <Calendar className="mb-3 text-stone-300" size={40} />
          <h3 className="font-display text-lg font-semibold text-stone-700">No sessions yet</h3>
          <p className="mt-1 max-w-sm text-sm text-stone-500 font-body">
            Be the first to create a session in your area.
          </p>
          <Button onClick={() => setCreateOpen(true)} className="mt-4 gap-2" size="sm">
            <Plus size={14} />
            Create a Session
          </Button>
        </div>
      )}

      {!isLoading && sessions && sessions.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sessions.map((session) => (
            <SessionCard
              key={session.id.toString()}
              session={session}
              starred={isStarred(session)}
              onStar={() => starSession.mutate(session.id)}
            />
          ))}
        </div>
      )}

      {createOpen && <CreateSessionModal onClose={() => setCreateOpen(false)} />}
    </div>
  );
}
