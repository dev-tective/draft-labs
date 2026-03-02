import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/supabaseClient";
import { useTagsStore } from "@/stores/tagsStore";
import { useMatchStore } from "@/stores/matchStore";
import { AlertType, useAlertStore } from "@/stores/alertStore";
import { Team } from "./useTeam";

export enum Game {
    MLBB = 'MLBB',
}

export interface Match {
    id: string;
    best_of: number;
    bans_per_team: number;
    created_at: string;
    expires_at: string;
    game: Game;
    // teams: Team[];
    user_id: string;
}

export const useMatches = () => {
    const addAlert = useAlertStore((state) => state.addAlert);

    return useQuery({
        queryKey: ["matches"],
        queryFn: async () => {
            // Obtener el usuario autenticado
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                throw new Error('User not authenticated');
            }

            // Fetch all matches for the authenticated user
            const { data, error } = await supabase
                .from('matches')
                .select(`
                    *,
                    teams (
                        *,
                        players (
                            *,
                            lanes (*)
                        )
                    )
                `)
                .eq('user_id', user.id)
                .gt('expires_at', new Date().toISOString())
                .order('created_at', { referencedTable: 'teams', ascending: true });

            if (error) {
                addAlert({
                    message: 'Error getting matches',
                    type: AlertType.ERROR,
                });
                throw error;
            }

            return data as Match[];
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 30, // 30 minutes
    });
}

/**
 * Hook para obtener un match individual por ID
 * Verifica si el match está expirado y lo elimina del cache si es necesario
 * Limpia automáticamente el currentMatchId del store si el match no existe o expiró
 */
export const useMatch = (id: string) => {
    const addAlert = useAlertStore((state) => state.addAlert);

    return useQuery({
        queryKey: ["match", id],
        queryFn: async () => {
            if (!id) return null;

            const { data, error } = await supabase
                .from('matches')
                .select(`
                    *,
                    teams (
                        *,
                        players (
                            *,
                            lanes (*)
                        )
                    )
                `)
                .eq('id', id)
                .order('created_at', { referencedTable: 'teams', ascending: true })
                .gt('expires_at', new Date().toISOString())
                .single();

            // Si el match no existe o expiró, limpiar el currentMatchId del store
            if (error) {
                useMatchStore.getState().clearCurrentMatchId();

                addAlert({
                    message: 'Match not found or expired',
                    type: AlertType.ERROR,
                });

                throw error;
            }

            useMatchStore.getState().setCurrentMatchId(id);
            useTagsStore.getState().getLanes(data.game);
            useTagsStore.getState().getMaps(data.game);

            return data as Match;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
        enabled: !!id, // Solo ejecutar si hay un ID
    });
}

/**
 * Hook para crear un nuevo match
 */
export const useCreateMatch = () => {
    const queryClient = useQueryClient();
    const addAlert = useAlertStore((state) => state.addAlert);

    return useMutation({
        mutationFn: async (params: {
            best_of?: number;
            bans_per_team?: number;
            game?: string;
        }) => {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) throw new Error('User not found');

            const { data, error } = await supabase
                .from("matches")
                .insert({
                    best_of: params.best_of,
                    bans_per_team: params.bans_per_team,
                    game: params.game,
                    user_id: user.id,
                })
                .select(`
                    *,
                    teams (
                        *,
                        players (
                            *,
                            lanes (*)
                        )
                    )
                `)
                .single();

            if (error) {
                addAlert({
                    message: 'Error creating match',
                    type: AlertType.ERROR,
                });
                throw error;
            }

            return data as Match;
        },
        onSuccess: (data) => {
            // Cache the newly created match individually
            queryClient.setQueryData(["match", data.id], data);

            // Invalidate the matches list to refetch
            queryClient.invalidateQueries({ queryKey: ["matches"] });

            addAlert({
                message: 'Match created successfully',
                type: AlertType.SUCCESS,
            });
        },
    });
}

/**
 * Hook para actualizar un match existente
 */
export const useUpdateMatch = () => {
    const queryClient = useQueryClient();
    const addAlert = useAlertStore((state) => state.addAlert);

    return useMutation({
        mutationFn: async (params: {
            id: string;
            best_of?: number;
            bans_per_team?: number;
            game?: Game;
        }) => {
            const { id, ...updateData } = params;

            const { data, error } = await supabase
                .from('matches')
                .update(updateData)
                .eq('id', id)
                .select(`
                    *,
                    teams (
                        *,
                        players (
                            *,
                            lanes (*)
                        )
                    )
                `)
                .single();

            if (error) {
                addAlert({
                    message: 'Error updating match',
                    type: AlertType.ERROR,
                });
                throw error;
            }

            addAlert({
                message: 'Match updated successfully',
                type: AlertType.SUCCESS,
            });

            return data as Match;
        },
        onMutate: async (params) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: ["match", params.id] });

            // Snapshot the previous value
            const previousMatch = queryClient.getQueryData<Match>(["match", params.id]);

            // Optimistically update the cache
            if (previousMatch) {
                queryClient.setQueryData<Match>(["match", params.id], {
                    ...previousMatch,
                    best_of: params.best_of ?? previousMatch.best_of,
                    bans_per_team: params.bans_per_team ?? previousMatch.bans_per_team,
                    game: (params.game as Game) ?? previousMatch.game,
                });
            }

            return { previousMatch };
        },
        onError: (_err, _params, context) => {
            // Rollback to the previous value on error
            if (context?.previousMatch) {
                queryClient.setQueryData(["match", _params.id], context.previousMatch);
            }
            addAlert({
                message: 'Error updating match',
                type: AlertType.ERROR,
            });
        },
        onSuccess: (_data, variables) => {
            // Invalidate the specific match query to trigger a refetch
            // We do NOT use setQueryData here because the response data from the update
            // might not include the side-effects (games created/deleted) from the SQL trigger
            // which runs AFTER the update.
            queryClient.invalidateQueries({ queryKey: ["match", variables.id] });

            // Invalidate the games query for this match
            queryClient.invalidateQueries({ queryKey: ["games"] });

            // Invalidate the matches list as well
            queryClient.invalidateQueries({ queryKey: ["matches"] });
        },
    });
}

/**
 * Hook para eliminar un match
 */
export const useDeleteMatch = () => {
    const queryClient = useQueryClient();
    const addAlert = useAlertStore((state) => state.addAlert);

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('matches')
                .delete()
                .eq('id', id);

            if (error) {
                addAlert({
                    message: 'Error deleting match',
                    type: AlertType.ERROR,
                });
                throw error;
            }

            return id;
        },
        onSuccess: (id) => {
            // Remove the match from the individual cache
            queryClient.removeQueries({ queryKey: ["match", id] });

            // Invalidate the matches list
            queryClient.invalidateQueries({ queryKey: ["matches"] });

            useMatchStore.getState().clearCurrentMatchId();

            addAlert({
                message: 'Match deleted successfully',
                type: AlertType.SUCCESS,
            });
        },
    });
}
