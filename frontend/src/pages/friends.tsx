import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Loader2, UserPlus, Check, X, Users, Clock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useMyFriends, usePendingRequests, useSendFriendRequest, useRespondToFriendRequest } from "@/hooks/use-social";
import { useUserProfile } from "@/hooks/use-users";
import { Principal } from "@icp-sdk/core/principal";
import type { FriendRequest } from "@/bindings/backend/backend";

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

function principalToShort(p: unknown): string {
  const text = principalToText(p);
  if (text.length > 14) return `${text.slice(0, 8)}...${text.slice(-4)}`;
  return text;
}

function FriendItem({ principalVal }: { principalVal: unknown }) {
  const principalText = principalToText(principalVal);
  let parsedPrincipal: Principal | undefined;
  try {
    parsedPrincipal = Principal.fromText(principalText);
  } catch {
    parsedPrincipal = undefined;
  }

  const { data: profile } = useUserProfile(parsedPrincipal);

  return (
    <Link
      to="/profile/$principalId"
      params={{ principalId: principalText }}
      className="flex items-center gap-3 rounded-lg border border-parchment-200 bg-white p-3 shadow-sm hover:shadow-card transition-all duration-200"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-moss-100 text-moss-700 shrink-0 font-display font-bold text-sm">
        {profile?.profile.displayName?.charAt(0).toUpperCase() ?? "?"}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-stone-800 font-body truncate">
          {profile?.profile.displayName ?? "Unknown User"}
        </p>
        <p className="text-xs text-stone-400 font-mono truncate">{principalToShort(principalVal)}</p>
      </div>
    </Link>
  );
}

function PendingRequestItem({
  request,
  onRespond,
}: {
  request: FriendRequest;
  onRespond: (id: bigint, accept: boolean) => void;
}) {
  const fromText = principalToText(request.from);
  let parsedPrincipal: Principal | undefined;
  try {
    parsedPrincipal = Principal.fromText(fromText);
  } catch {
    parsedPrincipal = undefined;
  }
  const { data: profile } = useUserProfile(parsedPrincipal);

  return (
    <div className="flex items-center gap-3 rounded-lg border border-parchment-200 bg-white p-3 shadow-sm">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-700 shrink-0 font-display font-bold text-sm">
        {profile?.profile.displayName?.charAt(0).toUpperCase() ?? "?"}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-stone-800 font-body truncate">
          {profile?.profile.displayName ?? "Unknown User"}
        </p>
        <p className="text-xs text-stone-400 font-mono truncate">{principalToShort(request.from)}</p>
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          type="button"
          onClick={() => onRespond(request.id, true)}
          className="inline-flex items-center gap-1 rounded-md bg-moss-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-moss-700 transition-colors cursor-pointer"
        >
          <Check size={12} /> Accept
        </button>
        <button
          type="button"
          onClick={() => onRespond(request.id, false)}
          className="inline-flex items-center gap-1 rounded-md border border-stone-300 px-2.5 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-50 transition-colors cursor-pointer"
        >
          <X size={12} /> Decline
        </button>
      </div>
    </div>
  );
}

export function FriendsPage() {
  const { data: friends, isLoading: friendsLoading } = useMyFriends();
  const { data: pending, isLoading: pendingLoading } = usePendingRequests();
  const sendRequest = useSendFriendRequest();
  const respondRequest = useRespondToFriendRequest();

  const [addInput, setAddInput] = useState("");

  async function handleSendRequest(e: React.FormEvent) {
    e.preventDefault();
    const text = addInput.trim();
    if (!text) return;

    let principal: Principal;
    try {
      principal = Principal.fromText(text);
    } catch {
      toast.error("Invalid principal ID");
      return;
    }

    try {
      await sendRequest.mutateAsync(principal);
      toast.success("Friend request sent!");
      setAddInput("");
    } catch {
      toast.error("Failed to send friend request");
    }
  }

  async function handleRespond(requestId: bigint, accept: boolean) {
    try {
      await respondRequest.mutateAsync({ requestId, accept });
      toast.success(accept ? "Friend request accepted!" : "Friend request declined");
    } catch {
      toast.error("Failed to respond to request");
    }
  }

  const pendingIncoming = pending?.filter((r) => r.status === "pending") ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-stone-900">Friends</h1>
        <p className="mt-1 text-sm text-stone-500 font-body">
          Connect with fellow musicians.
        </p>
      </div>

      {/* Add Friend */}
      <div className="rounded-xl border border-parchment-200 bg-white p-5 shadow-card">
        <h2 className="font-display text-lg font-semibold text-stone-900 mb-3 flex items-center gap-2">
          <UserPlus size={18} className="text-moss-600" />
          Add a Friend
        </h2>
        <form onSubmit={handleSendRequest} className="flex gap-2">
          <input
            type="text"
            value={addInput}
            onChange={(e) => setAddInput(e.target.value)}
            placeholder="Paste a principal ID (e.g. aaaaa-aa)"
            className="flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:border-moss-500 focus:outline-none focus:ring-2 focus:ring-moss-500/20 font-body"
          />
          <Button type="submit" disabled={sendRequest.isPending || !addInput.trim()} className="gap-1.5 shrink-0">
            {sendRequest.isPending ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
            Send Request
          </Button>
        </form>
      </div>

      {/* Pending Requests */}
      {(pendingLoading || pendingIncoming.length > 0) && (
        <div className="rounded-xl border border-parchment-200 bg-white p-5 shadow-card">
          <h2 className="font-display text-lg font-semibold text-stone-900 mb-3 flex items-center gap-2">
            <Clock size={18} className="text-amber-600" />
            Pending Requests
            {pendingIncoming.length > 0 && (
              <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 font-body">
                {pendingIncoming.length}
              </span>
            )}
          </h2>
          {pendingLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="animate-spin text-moss-500" size={24} />
            </div>
          ) : (
            <div className="space-y-2">
              {pendingIncoming.map((req) => (
                <PendingRequestItem
                  key={req.id.toString()}
                  request={req}
                  onRespond={handleRespond}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Friends list */}
      <div className="rounded-xl border border-parchment-200 bg-white p-5 shadow-card">
        <h2 className="font-display text-lg font-semibold text-stone-900 mb-3 flex items-center gap-2">
          <Users size={18} className="text-moss-600" />
          My Friends
          {friends && (
            <span className="ml-auto rounded-full bg-parchment-100 px-2 py-0.5 text-xs font-medium text-stone-500 font-body">
              {friends.length}
            </span>
          )}
        </h2>

        {friendsLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="animate-spin text-moss-500" size={24} />
          </div>
        ) : !friends || friends.length === 0 ? (
          <p className="text-sm text-stone-400 italic font-body">
            No friends yet. Add someone by pasting their principal ID above.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {friends.map((p, i) => (
              <FriendItem key={i} principalVal={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
