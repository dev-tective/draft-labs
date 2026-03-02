import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/supabaseClient";
import { Match } from "./useMatch";
import { AlertType, useAlertStore } from "@/stores/alertStore";
import { Player } from "./usePlayer";

export interface Team {
    id: string;
    name: string;
    acronym: string;
    logo_url?: string;
    coach?: string | null;
    created_at: string;
    match_id: string;
    players: Player[];
}

export const useCreateTeam = () => {
    const queryClient = useQueryClient();
    const addAlert = useAlertStore((state) => state.addAlert);

    return useMutation({
        mutationFn: async (params: {
            name: string;
            acronym: string;
            logo_url?: string;
            coach?: string;
            match_id: string;
            players?: Array<{
                nickname: string;
                image_url?: string;
                lane_id?: string;
            }>;
        }) => {
            // Crear equipo con jugadores usando RPC atómico
            const { data, error } = await supabase.rpc('create_team_with_players', {
                p_match_id: params.match_id,
                p_name: params.name,
                p_acronym: params.acronym,
                p_logo_url: params.logo_url,
                p_coach: params.coach,
                p_players: params.players || []
            });

            console.log(data);

            if (error) {
                console.error('Error creating team:', error);
                addAlert({
                    message: 'Error creating team',
                    type: AlertType.ERROR,
                });
                throw error;
            }

            return data as Team;
        },
        onSuccess: (newTeam, variables) => {
            // Actualizar el caché del match con el nuevo equipo
            queryClient.setQueryData<Match>(["match", variables.match_id], (oldMatch) => {
                if (!oldMatch) return oldMatch;

                return {
                    ...oldMatch,
                    teams: [...(oldMatch.teams || []), newTeam],
                };
            });

            addAlert({
                message: 'Team created successfully',
                type: AlertType.SUCCESS,
            });

            // Invalidar la lista de matches
            queryClient.invalidateQueries({ queryKey: ["matches"] });
        },
    });
};

/**
 * Hook para actualizar un equipo existente
 * Actualiza el caché del match con los datos del equipo actualizado
 */
export const useUpdateTeam = () => {
    const queryClient = useQueryClient();
    const addAlert = useAlertStore((state) => state.addAlert);

    return useMutation({
        mutationFn: async (params: {
            id: string;
            name?: string;
            acronym?: string;
            logo_url?: string | null;
            coach?: string | null;
            match_id: string;
        }) => {
            const { id, ...updateData } = params;

            const { data, error } = await supabase
                .from('teams')
                .update(updateData)
                .eq('id', id)
                .select(`
                    *,
                    players (
                        *,
                        lanes (*)
                    )
                `)
                .single();

            if (error) {
                console.error('Error updating team:', error);
                addAlert({
                    message: 'Error updating team',
                    type: AlertType.ERROR,
                });
                throw error;
            }

            addAlert({
                message: 'Team updated successfully',
                type: AlertType.SUCCESS,
            });

            return data as Team;
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
                    teams: previousMatch.teams?.map(team =>
                        team.id === params.id
                            ? {
                                ...team,
                                name: params.name ?? team.name,
                                acronym: params.acronym ?? team.acronym,
                                logo_url: params.logo_url ?? team.logo_url,
                                coach: params.coach ?? team.coach,
                            }
                            : team
                    ) || [],
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
                message: 'Error updating team',
                type: AlertType.ERROR,
            });
        },
        onSuccess: (updatedTeam, variables) => {
            // Update the match cache with the updated team
            queryClient.setQueryData<Match>(["match", variables.match_id], (oldMatch) => {
                if (!oldMatch) return oldMatch;

                return {
                    ...oldMatch,
                    teams: oldMatch.teams?.map(team =>
                        team.id === updatedTeam.id ? updatedTeam : team
                    ) || [],
                };
            });

            // Invalidate the matches list
            queryClient.invalidateQueries({ queryKey: ["matches"] });
        },
    });
};

/**
 * Hook para eliminar un equipo
 * Actualiza el caché del match removiendo el equipo
 */
export const useDeleteTeam = () => {
    const queryClient = useQueryClient();
    const addAlert = useAlertStore((state) => state.addAlert);

    return useMutation({
        mutationFn: async (params: { teamId: string; match_id: string }) => {
            const { error } = await supabase
                .from('teams')
                .delete()
                .eq('id', params.teamId);

            if (error) {
                addAlert({
                    message: 'Error deleting team',
                    type: AlertType.ERROR,
                });
                throw error;
            }

            return params.teamId;
        },
        onSuccess: (deletedTeamId, variables) => {
            // Actualizar el caché del match removiendo el equipo
            queryClient.setQueryData<Match>(["match", variables.match_id], (oldMatch) => {
                if (!oldMatch) return oldMatch;

                return {
                    ...oldMatch,
                    teams: oldMatch.teams?.filter(team => team.id !== deletedTeamId) || [],
                };
            });

            addAlert({
                message: 'Team deleted successfully',
                type: AlertType.SUCCESS,
            });

            // Invalidar la lista de matches
            queryClient.invalidateQueries({ queryKey: ["matches"] });
        },
    });
};
