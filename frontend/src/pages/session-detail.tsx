import { useParams, useNavigate } from "@tanstack/react-router";
import {
  Loader2,
  MapPin,
  Calendar,
  Users,
  Lock,
  Unlock,
  ArrowLeft,
  List,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StarButton } from "@/components/star-button";
import { useAuth } from "@/auth";
import { useGetSession, useJoinSession, useStarSession } from "@/hooks/use-sessions";
import { DifficultyLevel, SessionFrequency } from "@/bindings/backend/backend";

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

function principalToShort(p: unknown): string {
  const text =
    typeof p === "object" && p !== null && "toText" in p && typeof (p as { toText?: () => string }).toText === "function"
      ? (p as { toText: () => string }).toText()
      : String(p);
  if (text.length > 14) return `${text.slice(0, 5)}...${text.slice(-3)}`;
  return text;
}

export function SessionDetailPage() {
  const { sessionId } = useParams({ from: "/session/$sessionId" });
  const navigate = useNavigate();
  const { principal } = useAuth();

  const id = BigInt(sessionId);
  const { data: session, isLoading } = useGetSession(id);
  const joinSession = useJoinSession();
  const starSession = useStarSession();

  const starred = session?.starredBy.some((p) => {
    if (typeof p === "object" && p !== null && "toText" in p && typeof (p as { toText?: () => string }).toText === "function") {
      return (p as { toText: () => string }).toText() === principal;
    }
    return String(p) === principal;
  }) ?? false;

  const isAttending = session?.attendees.some((p) => {
    if (typeof p === "object" && p !== null && "toText" in p && typeof (p as { toText?: () => string }).toText === "function") {
      return (p as { toText: () => string }).toText() === principal;
    }
    return String(p) === principal;
  }) ?? false;

  async function handleJoin() {
    try {
      await joinSession.mutateAsync(id);
      toast.success("Joined session!");
    } catch {
      toast.error("Failed to join session");
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-moss-500" size={32} />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-20">
        <p className="text-stone-500 font-body">Session not found.</p>
        <Button variant="outline" className="mt-4 gap-2" onClick={() => navigate({ to: "/sessions" })}>
          <ArrowLeft size={14} />
          Back to Sessions
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        type="button"
        onClick={() => navigate({ to: "/sessions" })}
        className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700 transition-colors font-body cursor-pointer"
      >
        <ArrowLeft size={14} />
        Back to Sessions
      </button>

      {/* Header */}
      <div className="rounded-xl border border-parchment-200 bg-white p-6 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-2xl font-bold text-stone-900">{session.name}</h1>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-medium font-body",
                  difficultyColor(session.difficulty)
                )}
              >
                {difficultyLabel(session.difficulty)}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium font-body",
                  session.isOpen
                    ? "bg-moss-100 text-moss-700"
                    : "bg-stone-100 text-stone-600"
                )}
              >
                {session.isOpen ? <Unlock size={10} /> : <Lock size={10} />}
                {session.isOpen ? "Open" : "Closed"}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-stone-500 font-body">
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={14} />
                {session.location.city}, {session.location.country}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar size={14} />
                {frequencyLabel(session.frequency)} — {session.time}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users size={14} />
                {session.attendees.length} attending
              </span>
            </div>

            {session.description && (
              <p className="mt-3 text-sm text-stone-600 font-body leading-relaxed">
                {session.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <StarButton
              starred={starred}
              count={session.starredBy.length}
              onToggle={() => starSession.mutate(id)}
            />
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          {!isAttending && (
            <Button onClick={handleJoin} disabled={joinSession.isPending} className="gap-2">
              {joinSession.isPending && <Loader2 size={14} className="animate-spin" />}
              {joinSession.isPending ? "Joining..." : "Join Session"}
            </Button>
          )}
          {isAttending && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-moss-50 border border-moss-200 px-3 py-1.5 text-sm font-medium text-moss-700 font-body">
              <Users size={14} />
              You're attending
            </span>
          )}
        </div>
      </div>

      {/* Attendees */}
      <div className="rounded-xl border border-parchment-200 bg-white p-5 shadow-card">
        <h2 className="font-display text-lg font-semibold text-stone-900 mb-4 flex items-center gap-2">
          <Users size={18} className="text-moss-600" />
          Attendees
          <span className="ml-auto rounded-full bg-parchment-100 px-2 py-0.5 text-xs font-medium text-stone-500 font-body">
            {session.attendees.length}
          </span>
        </h2>
        {session.attendees.length === 0 ? (
          <p className="text-sm text-stone-400 italic font-body">No attendees yet. Be the first to join!</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {session.attendees.map((p, i) => (
              <span
                key={i}
                className="inline-flex items-center rounded-full bg-parchment-100 px-3 py-1 text-xs font-mono text-stone-600"
              >
                {principalToShort(p)}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Setlists placeholder */}
      <div className="rounded-xl border border-parchment-200 bg-white p-5 shadow-card">
        <h2 className="font-display text-lg font-semibold text-stone-900 mb-4 flex items-center gap-2">
          <List size={18} className="text-moss-600" />
          Setlists
        </h2>
        <p className="text-sm text-stone-400 italic font-body">No setlists yet.</p>
      </div>
    </div>
  );
}
