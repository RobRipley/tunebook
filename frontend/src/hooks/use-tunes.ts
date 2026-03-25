import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/auth";
import type { TuneCreateRequest, TuneType } from "@/bindings/backend/backend";

export function useListTunes() {
  const { backend } = useAuth();
  return useQuery({
    queryKey: ["tunes"],
    queryFn: () => backend!.listTunes(),
    enabled: !!backend,
  });
}

export function useGetTune(tuneId: bigint | undefined) {
  const { backend } = useAuth();
  return useQuery({
    queryKey: ["tune", tuneId?.toString()],
    queryFn: () => backend!.getTune(tuneId!),
    enabled: !!backend && tuneId !== undefined,
  });
}

export function useCreateTune() {
  const { backend } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: TuneCreateRequest) => backend!.createTune(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tunes"] });
    },
  });
}

export function useStarTune() {
  const { backend } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tuneId: bigint) => backend!.starTune(tuneId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tunes"] });
    },
  });
}

export function useUnstarTune() {
  const { backend } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tuneId: bigint) => backend!.unstarTune(tuneId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tunes"] });
    },
  });
}

export function useAddSetting() {
  const { backend } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tuneId, abcNotation }: { tuneId: bigint; abcNotation: string }) =>
      backend!.addSetting(tuneId, abcNotation),
    onSuccess: (_, { tuneId }) => {
      queryClient.invalidateQueries({ queryKey: ["tune", tuneId.toString()] });
    },
  });
}

export function useEditSetting() {
  const { backend } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tuneId, settingId, newAbc }: { tuneId: bigint; settingId: bigint; newAbc: string }) =>
      backend!.editSetting(tuneId, settingId, newAbc),
    onSuccess: (_, { tuneId }) => {
      queryClient.invalidateQueries({ queryKey: ["tune", tuneId.toString()] });
    },
  });
}

export function useMarkPlaySetting() {
  const { backend } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tuneId, settingId }: { tuneId: bigint; settingId: bigint }) =>
      backend!.markPlaySetting(tuneId, settingId),
    onSuccess: (_, { tuneId }) => {
      queryClient.invalidateQueries({ queryKey: ["tune", tuneId.toString()] });
      queryClient.invalidateQueries({ queryKey: ["tunes"] });
    },
  });
}

export function useAddAlternateName() {
  const { backend } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tuneId, name }: { tuneId: bigint; name: string }) =>
      backend!.addAlternateName(tuneId, name),
    onSuccess: (_, { tuneId }) => {
      queryClient.invalidateQueries({ queryKey: ["tune", tuneId.toString()] });
    },
  });
}

export function useUpvoteAlternateName() {
  const { backend } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tuneId, name }: { tuneId: bigint; name: string }) =>
      backend!.upvoteAlternateName(tuneId, name),
    onSuccess: (_, { tuneId }) => {
      queryClient.invalidateQueries({ queryKey: ["tune", tuneId.toString()] });
    },
  });
}

export function useSearchThesession(searchQuery: string, tuneType?: string) {
  const { backend } = useAuth();
  return useQuery({
    queryKey: ["thesession-search", searchQuery, tuneType],
    queryFn: async () => {
      const raw = await backend!.searchThesessionTunes(searchQuery, tuneType ?? null, 1n);
      try {
        return JSON.parse(raw);
      } catch {
        return { tunes: [] };
      }
    },
    enabled: !!backend && searchQuery.length > 2,
    staleTime: 5 * 60 * 1000, // cache results for 5 min (saves cycles)
    retry: false, // don't retry failed HTTPS outcalls
  });
}

export function useImportThesessionTune() {
  const { backend } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      thesessionId: bigint;
      title: string;
      abcNotation: string;
      tuneType: TuneType;
      key: string;
    }) =>
      backend!.importThesessionTune(
        args.thesessionId,
        args.title,
        args.abcNotation,
        args.tuneType,
        args.key
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tunes"] });
    },
  });
}
