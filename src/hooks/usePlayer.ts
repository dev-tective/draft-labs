import { AlertType, useAlertStore } from "@/stores/alertStore";
import { supabase } from "@/supabaseClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Match } from "./useMatch";
import { Tag } from "@/stores/tagsStore";
import { Team } from "./useTeam";

export interface Player {
    id: string;
    nickname: string;
    team_id: string;
    image_url?: string;
    lane_id?: number;
    lanes?: Tag;
    is_active: boolean;
    created_at: string;
}

export const useCreatePlayer = () => {
    const queryClient = useQueryClient();
    const addAlert = useAlertStore((state) => state.addAlert);

    return useMutation({
        mutationFn: async (params: {
            nickname: string;
            team_id: string;
            image_url?: string | null;
            lane_id?: number | null;
            match_id: string;
        }) => {
            const { data, error } = await supabase
                .from('players')
                .insert({
                    nickname: params.nickname,
                    team_id: params.team_id,
                    image_url: params.image_url,
                    lane_id: params.lane_id,
                })
                .select(`
                    *,
                    lanes(*)
                `)
                .single();

            if (error) {
                console.error('Error creating player:', error);
                addAlert({
                    message: 'Error creating player',
                    type: AlertType.ERROR,
                });
                throw error;
            }

            return data as Player;
        },
        onSuccess: (newPlayer, variables) => {
            // Actualizar el caché del match con el nuevo jugador
            queryClient.setQueryData<Match>(["match", variables.match_id], (oldMatch) => {
                if (!oldMatch) return oldMatch;

                return {
                    ...oldMatch,
                    teams: oldMatch.teams?.map(team =>
                        team.id === newPlayer.team_id
                            ? {
                                ...team,
                                players: [...(team.players || []), newPlayer],
                            }
                            : team
                    ) || [],
                };
            });

            addAlert({
                message: 'Player created successfully',
                type: AlertType.SUCCESS,
            });

            // Invalidar la lista de matches
            queryClient.invalidateQueries({ queryKey: ["matches"] });
        },
    });
};

/**
 * Hook para actualizar un jugador existente
 * Actualiza el caché del match con los datos del jugador actualizado
 */
export const useUpdatePlayer = () => {
    const queryClient = useQueryClient();
    const addAlert = useAlertStore((state) => state.addAlert);

    return useMutation({
        mutationFn: async (params: {
            id: string;
            match_id: string;
            nickname?: string;
            image_url?: string | null;
            lane_id?: number | null;
            is_active?: boolean;
        }) => {
            const { id, match_id, ...updateData } = params;

            const { data, error } = await supabase
                .from('players')
                .update(updateData)
                .eq('id', id)
                .select(`
                    *,
                    lanes(*)
                `)
                .single();

            if (error) {
                console.error('Error updating player:', error);
                addAlert({
                    message: 'Error updating player',
                    type: AlertType.ERROR,
                });
                throw error;
            }

            addAlert({
                message: 'Player updated successfully',
                type: AlertType.SUCCESS,
            });

            return data as Player;
        },
        onMutate: async (params) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: ["match", params.match_id] });

            // Snapshot the previous value
            const previousMatch = queryClient.getQueryData<Match>(["match", params.match_id]);

            // Optimistically update the cache
            if (previousMatch) {
                queryClient.setQueryData<Match>(["match", params.match_id], {
                    ...previousMatch,
                    teams: previousMatch.teams?.map(team => ({
                        ...team,
                        players: team.players?.map((player: Player) =>
                            player.id === params.id
                                ? {
                                    ...player,
                                    nickname: params.nickname ?? player.nickname,
                                    image_url: params.image_url ?? player.image_url,
                                    lane_id: params.lane_id ?? player.lane_id,
                                    is_active: params.is_active ?? player.is_active,
                                }
                                : player
                        ) || [],
                    })) || [],
                });
            }

            return { previousMatch };
        },
        onError: (_err, params, context) => {
            // Rollback to the previous value on error
            if (context?.previousMatch) {
                queryClient.setQueryData(["match", params.match_id], context.previousMatch);
            }
            addAlert({
                message: 'Error updating player',
                type: AlertType.ERROR,
            });
        },
        onSuccess: (updatedPlayer, variables) => {
            // Update the match cache with the updated player
            queryClient.setQueryData<Match>(["match", variables.match_id], (oldMatch) => {
                if (!oldMatch) return oldMatch;

                return {
                    ...oldMatch,
                    teams: oldMatch.teams?.map(team => ({
                        ...team,
                        players: team.players?.map((player: Player) =>
                            player.id === updatedPlayer.id ? updatedPlayer : player
                        ) || [],
                    })) || [],
                };
            });

            // Invalidate the matches list
            queryClient.invalidateQueries({ queryKey: ["matches"] });
        },
    });
};

/**
 * Hook para eliminar un jugador
 * Actualiza el caché del match removiendo el jugador del equipo
 */
export const useDeletePlayer = () => {
    const queryClient = useQueryClient();
    const addAlert = useAlertStore((state) => state.addAlert);

    return useMutation({
        mutationFn: async (params: { playerId: string; match_id: string }) => {
            const { error } = await supabase
                .from('players')
                .delete()
                .eq('id', params.playerId);

            if (error) {
                addAlert({
                    message: 'Error deleting player',
                    type: AlertType.ERROR,
                });
                throw error;
            }

            return params.playerId;
        },
        onSuccess: (deletedPlayerId, variables) => {
            // Actualizar el caché del match removiendo el jugador
            queryClient.setQueryData<Match>(["match", variables.match_id], (oldMatch) => {
                if (!oldMatch) return oldMatch;

                return {
                    ...oldMatch,
                    teams: oldMatch.teams?.map((team: Team) => ({
                        ...team,
                        players: team.players?.filter(player => player.id !== deletedPlayerId) || [],
                    })) || [],
                };
            });

            addAlert({
                message: 'Player deleted successfully',
                type: AlertType.SUCCESS,
            });

            // Invalidar la lista de matches
            queryClient.invalidateQueries({ queryKey: ["matches"] });
        },
    });
};