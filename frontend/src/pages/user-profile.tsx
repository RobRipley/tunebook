import { useParams, useNavigate } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Loader2, Music, BookOpen, MapPin, User, ArrowLeft, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useUserProfile } from "@/hooks/use-users";
import { useSendFriendRequest, useMyFriends } from "@/hooks/use-social";
import { useListTunes } from "@/hooks/use-tunes";
import { useAuth } from "@/auth";
import { Principal } from "@icp-sdk/core/principal";
import type { Instrument } from "@/bindings/backend/backend";

function formatInstrument(inst: Instrument): string {
  if (inst.__kind__ === "other") return inst.other;
  const labels: Record<string, string> = {
    fiddle: "Fiddle", flute: "Flute", tinWhistle: "Tin Whistle",
    uilleannPipes: "Uilleann Pipes", accordion: "Accordion",
    concertina: "Concertina", bouzouki: "Bouzouki", banjo: "Banjo",
    guitar: "Guitar", mandolin: "Mandolin", bodhran: "Bodhran",
    harp: "Harp", vocals: "Vocals",
  };
  return labels[inst.__kind__] ?? inst.__kind__;
}

function principalToText(p: unknown): string {
  if (
    typeof p === "object" &&
    p !== null &&
    "toText" in p &&
    typeof (p as { toText?: () => string }).toText === "function"
  ) {
    return (p as { toText: () => string }).toText();
  }
  return String(p);
}

export function UserProfilePage() {
  const { principalId } = useParams({ from: "/profile/$principalId" });
  const navigate = useNavigate();
  const { principal: myPrincipal } = useAuth();

  let targetPrincipal: Principal | undefined;
  try {
    targetPrincipal = Principal.fromText(principalId);
  } catch {
    targetPrincipal = undefined;
  }

  const { data: profile, isLoading } = useUserProfile(targetPrincipal);
  const { data: tunes } = useListTunes();
  const { data: friends } = useMyFriends();
  const sendRequest = useSendFriendRequest();

  const isOwnProfile = myPrincipal === principalId;
  const isFriend = friends?.some((p) => principalToText(p) === principalId) ?? false;

  async function handleAddFriend() {
    if (!targetPrincipal) return;
    try {
      await sendRequest.mutateAsync(targetPrincipal);
      toast.success("Friend request sent!");
    } catch {
      toast.error("Failed to send friend request");
    }
  }

  if (!targetPrincipal) {
    return (
      <div className="text-center py-20">
        <p className="text-stone-500 font-body">Invalid principal ID.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate({ to: "/" })}>
          Go Home
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-moss-500" size={32} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <p className="text-stone-500 font-body">This user hasn't set up a profile yet.</p>
        <Button variant="outline" className="mt-4 gap-2" onClick={() => navigate({ to: "/" })}>
          <ArrowLeft size={14} />
          Go Home
        </Button>
      </div>
    );
  }

  const p = profile.profile;
  const knownTunes = tunes?.filter((t) => profile.knownTuneIds.includes(t.id)) ?? [];
  const wishTunes = tunes?.filter((t) => profile.wishListTuneIds.includes(t.id)) ?? [];

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate({ to: "/friends" })}
        className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700 transition-colors font-body cursor-pointer"
      >
        <ArrowLeft size={14} />
        Back
      </button>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Profile card */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-xl border border-parchment-200 bg-white p-5 shadow-card space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-moss-100 text-moss-700 shrink-0 font-display font-bold text-xl">
                {p.displayName?.charAt(0).toUpperCase() ?? "?"}
              </span>
              <div>
                <h1 className="font-display text-xl font-bold text-stone-900">{p.displayName}</h1>
                {p.location && (
                  <p className="text-sm text-stone-500 font-body flex items-center gap-1">
                    <MapPin size={12} />
                    {p.location.city}, {p.location.country}
                  </p>
                )}
              </div>
            </div>

            {p.bio && (
              <p className="text-sm text-stone-600 font-body leading-relaxed">{p.bio}</p>
            )}

            {p.instruments.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-stone-500 font-body uppercase tracking-wide mb-1.5">
                  Instruments
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {p.instruments.map((inst, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-parchment-100 px-2.5 py-0.5 text-xs font-medium text-stone-700 font-body"
                    >
                      {formatInstrument(inst)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {!isOwnProfile && (
              <div className="pt-1">
                {isFriend ? (
                  <span className="inline-flex items-center gap-1.5 text-sm text-moss-700 font-body">
                    <User size={14} />
                    Already friends
                  </span>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddFriend}
                    disabled={sendRequest.isPending}
                    className="gap-2"
                  >
                    {sendRequest.isPending ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <UserPlus size={14} />
                    )}
                    Add Friend
                  </Button>
                )}
              </div>
            )}

            {isOwnProfile && (
              <Link
                to="/profile"
                className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors font-body"
              >
                Edit My Profile
              </Link>
            )}
          </div>
        </div>

        {/* Right: Tunebook + Wish list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-parchment-200 bg-white p-5 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <Music size={18} className="text-moss-600" />
              <h2 className="font-display text-lg font-semibold text-stone-900">Tunebook</h2>
              <span className="ml-auto rounded-full bg-parchment-100 px-2 py-0.5 text-xs font-medium text-stone-500 font-body">
                {knownTunes.length}
              </span>
            </div>
            {knownTunes.length === 0 ? (
              <p className="text-sm text-stone-400 italic font-body">No tunes in their tunebook yet.</p>
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

          <div className="rounded-xl border border-parchment-200 bg-white p-5 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen size={18} className="text-moss-600" />
              <h2 className="font-display text-lg font-semibold text-stone-900">Wish List</h2>
              <span className="ml-auto rounded-full bg-parchment-100 px-2 py-0.5 text-xs font-medium text-stone-500 font-body">
                {wishTunes.length}
              </span>
            </div>
            {wishTunes.length === 0 ? (
              <p className="text-sm text-stone-400 italic font-body">Wish list is empty.</p>
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
