import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/auth";
import type { Principal } from "@icp-sdk/core/principal";

export function useMyFriends() {
  const { backend } = useAuth();
  return useQuery({
    queryKey: ["myFriends"],
    queryFn: () => backend!.getMyFriends(),
    enabled: !!backend,
  });
}

export function usePendingRequests() {
  const { backend } = useAuth();
  return useQuery({
    queryKey: ["pendingRequests"],
    queryFn: () => backend!.getMyPendingRequests(),
    enabled: !!backend,
  });
}

export function useSendFriendRequest() {
  const { backend } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (to: Principal) => backend!.sendFriendRequest(to),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingRequests"] });
    },
  });
}

export function useRespondToFriendRequest() {
  const { backend } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, accept }: { requestId: bigint; accept: boolean }) =>
      backend!.respondToFriendRequest(requestId, accept),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingRequests"] });
      queryClient.invalidateQueries({ queryKey: ["myFriends"] });
    },
  });
}
