import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/auth";
import type { Location, SessionFrequency, DifficultyLevel } from "@/bindings/backend/backend";

export function useListSessions() {
  const { backend } = useAuth();
  return useQuery({
    queryKey: ["sessions"],
    queryFn: () => backend!.listSessions(),
    enabled: !!backend,
  });
}

export function useGetSession(id: bigint | undefined) {
  const { backend } = useAuth();
  return useQuery({
    queryKey: ["session", id?.toString()],
    queryFn: () => backend!.getSession(id!),
    enabled: !!backend && id !== undefined,
  });
}

export function useCreateSession() {
  const { backend } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      name: string;
      location: Location;
      time: string;
      frequency: SessionFrequency;
      isOpen: boolean;
      difficulty: DifficultyLevel;
      description: string;
    }) =>
      backend!.createSession(
        args.name,
        args.location,
        args.time,
        args.frequency,
        args.isOpen,
        args.difficulty,
        args.description
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}

export function useJoinSession() {
  const { backend } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: bigint) => backend!.joinSession(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["session", id.toString()] });
    },
  });
}

export function useStarSession() {
  const { backend } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: bigint) => backend!.starSession(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["session", id.toString()] });
    },
  });
}

export function useListSetlistsBySession(sessionId: bigint | undefined) {
  const { backend } = useAuth();
  return useQuery({
    queryKey: ["setlists", "session", sessionId?.toString()],
    queryFn: () => backend!.listSetlistsBySession(sessionId!),
    enabled: !!backend && sessionId !== undefined,
  });
}
