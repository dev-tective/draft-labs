import { AlertType, useAlertStore } from "@/stores/alertStore";
import { supabase } from "@/supabaseClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePicksStore } from "@/stores/picksStore";

export interface MatchGame {
    id: string;
    game_number: number;
    match_id: string;
    map_id: number | null;
    winner_team_id: string | null;
    created_at: string;
}

export const useGames = (matchId: string) => {
    const addAlert = useAlertStore((state) => state.addAlert);
    const setCurrentGameId = usePicksStore((state) => state.setCurrentGameId);

    return useQuery({
        queryKey: ["games", matchId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("games")
                .select('*')
                .eq("match_id", matchId)
                .order("game_number", { ascending: true });

            if (error) {
                addAlert({
                    message: "Error getting games",
                    type: AlertType.ERROR,
                });
                throw error;
            }

            setCurrentGameId(data as MatchGame[]);

            return data as MatchGame[];
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 30, // 30 minutes
    });
}

export const useGame = (gameId: string) => {
    const addAlert = useAlertStore((state) => state.addAlert);

    return useQuery({
        queryKey: ["game", gameId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("games")
                .select('*')
                .eq("id", gameId)
                .single();

            if (error) {
                addAlert({
                    message: "Error getting game",
                    type: AlertType.ERROR,
                });
                throw error;
            }

            return data as MatchGame;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 30, // 30 minutes
    });
}

export const useUpdateGame = () => {
    const queryClient = useQueryClient();
    const addAlert = useAlertStore((state) => state.addAlert);
    const setCurrentGameId = usePicksStore((state) => state.setCurrentGameId);

    return useMutation({
        mutationFn: async (params: {
            id: string;
            match_id: string;
            winner_team_id?: string | null;
            map_id?: number | null;
        }) => {
            const { id, match_id, ...updateData } = params;

            const { data, error } = await supabase
                .from('games')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                addAlert({ message: 'Error updating game', type: AlertType.ERROR });
                throw error;
            }

            addAlert({ message: 'Game updated successfully', type: AlertType.SUCCESS });

            return data as MatchGame;
        },
        onMutate: async (params) => {
            // Cancelar queries en vuelo para evitar que sobreescriban el optimismo
            await queryClient.cancelQueries({ queryKey: ['games', params.match_id] });
            await queryClient.cancelQueries({ queryKey: ['game', params.id] });

            // Snapshot del estado previo para rollback
            const previousGames = queryClient.getQueryData<MatchGame[]>(['games', params.match_id]);
            const previousGame = queryClient.getQueryData<MatchGame>(['game', params.id]);

            // Actualizar cache optimistamente
            if (previousGames) {
                queryClient.setQueryData<MatchGame[]>(['games', params.match_id],
                    previousGames.map((g) =>
                        g.id === params.id ? { ...g, ...params } : g
                    )
                );
                setCurrentGameId(previousGames.map((g) =>
                    g.id === params.id ? { ...g, ...params } : g
                ));
            }

            if (previousGame) {
                queryClient.setQueryData<MatchGame>(['game', params.id], { ...previousGame, ...params });
            }

            return { previousGames, previousGame };
        },
        onError: (_err, _params, context) => {
            // Rollback en caso de error
            if (context?.previousGames) {
                queryClient.setQueryData(['games', _params.match_id], context.previousGames);
            }
            if (context?.previousGame) {
                queryClient.setQueryData(['game', _params.id], context.previousGame);
            }
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['games', variables.match_id] });
            queryClient.invalidateQueries({ queryKey: ['game', variables.id] });
        },
    });
}