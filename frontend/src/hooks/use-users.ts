import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/auth";
import type { UserProfile } from "@/bindings/backend/backend";
import type { Principal } from "@icp-sdk/core/principal";

export function useMyProfile() {
  const { backend } = useAuth();
  return useQuery({
    queryKey: ["myProfile"],
    queryFn: () => backend!.getMyProfile(),
    enabled: !!backend,
  });
}

export function useUserProfile(principal: Principal | undefined) {
  const { backend } = useAuth();
  return useQuery({
    queryKey: ["userProfile", principal?.toText()],
    queryFn: () => backend!.getUserProfile(principal!),
    enabled: !!backend && principal !== undefined,
  });
}

export function useSaveProfile() {
  const { backend } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (profile: UserProfile) => backend!.saveMyProfile(profile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myProfile"] });
    },
  });
}

export function useTopFriendTunes() {
  const { backend } = useAuth();
  return useQuery({
    queryKey: ["topFriendTunes"],
    queryFn: () => backend!.getTopFriendTunes(),
    enabled: !!backend,
  });
}

export function useTunesInCommon(other: Principal | undefined) {
  const { backend } = useAuth();
  return useQuery({
    queryKey: ["tunesInCommon", other?.toText()],
    queryFn: () => backend!.getTunesInCommon(other!),
    enabled: !!backend && other !== undefined,
  });
}
