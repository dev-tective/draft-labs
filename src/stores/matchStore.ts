import { supabase } from "@/supabaseClient";
import { AlertType, useAlertStore } from "@/stores/alertStore";
import { useTeamStore } from "@/stores/teamStore";
import { usePlayerStore } from "@/stores/playerStore";
import { useTagStore } from "@/stores/tagStore";
import { RealtimeChannel } from "@supabase/supabase-js";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export enum Game {
    MLBB = 'MLBB',
    LOL = 'LOL',
    DOTA2 = 'DOTA2',
}

export interface Match {
    id: string;
    best_of: number;
    bans_per_team: number;
    created_at: string;
    expires_at: string;
    game?: Game;
    user_id: string;
    start: boolean;
}

interface MatchState {
    matches: Match[];
    currentMatch: Match | null;
    channel: RealtimeChannel | null;
    loading: boolean;
    updateLoading: boolean;

    fetchMatches: () => Promise<void>;
    createMatch: (params: Partial<Match>) => Promise<void>;
    updateMatch: (params: Partial<Match>) => Promise<void>;
    deleteMatch: (matchId: string) => Promise<void>;
    startMatch: (matchId: string, teamRedId: string, teamBlueId: string, invert?: boolean) => Promise<void>;
    resetMatch: (matchId: string, teamIdsToDelete?: string[]) => Promise<void>;
    subscribeToMatch: (matchId: string) => void;
    closeChannel: () => void;
    unsubscribe: () => void;
}

export const useMatchStore = create<MatchState>()(
    persist(
        (set, get) => ({
            matches: [],
            currentMatch: null,
            channel: null,
            loading: false,
            updateLoading: false,

            fetchMatches: async () => {
                set({ loading: true, matches: [] });

                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    console.error('[MatchStore] User not authenticated');
                    set({ loading: false });
                    return;
                }

                const { data, error } = await supabase
                    .from('matches')
                    .select('*')
                    .eq('user_id', user.id)
                    .gt('expires_at', new Date().toISOString())
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('[MatchStore] Error fetching matches:', error);
                } else {
                    set({ matches: (data as Match[]) ?? [] });
                }

                set({ loading: false });
            },

            createMatch: async (params: Partial<Match>) => {
                set({ loading: true });

                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    useAlertStore.getState().addAlert({
                        message: 'User not authenticated',
                        type: AlertType.ERROR
                    });
                    set({ loading: false });
                    return;
                }

                const { data, error } = await supabase
                    .from('matches')
                    .insert({
                        best_of: params.best_of,
                        bans_per_team: params.bans_per_team,
                        game: params.game,
                        user_id: user.id,
                    })
                    .select('*')
                    .single();

                if (error) {
                    useAlertStore.getState().addAlert({
                        message: error.message,
                        type: AlertType.ERROR
                    });
                    set({ loading: false });
                    return;
                }

                const newMatch = data as Match;

                // Añadir a la lista y activar realtime con el nuevo match
                set((state) => ({ matches: [newMatch, ...state.matches] }));
                useAlertStore.getState().addAlert({
                    message: 'Match created successfully',
                    type: AlertType.SUCCESS
                });

                // subscribeToMatch maneja su propio loading internamente
                get().subscribeToMatch(newMatch.id);
            },

            startMatch: async (matchId: string, teamRedId: string, teamBlueId: string, invert = false) => {
                set({ updateLoading: true });

                const { error } = await supabase.rpc('start_match', {
                    p_match_id: matchId,
                    p_team_red_id: teamRedId,
                    p_team_blue_id: teamBlueId,
                    p_invert: invert,
                });

                if (error) {
                    console.error('[MatchStore] Error starting match:', error);
                    useAlertStore.getState().addAlert({
                        message: error.message,
                        type: AlertType.ERROR,
                    });
                    set({ updateLoading: false });
                    return;
                }

                useAlertStore.getState().addAlert({
                    message: 'Match started successfully',
                    type: AlertType.SUCCESS,
                });

                set({ updateLoading: false });
            },

            resetMatch: async (matchId: string, teamIdsToDelete: string[] = []) => {
                set({ updateLoading: true });

                const { error } = await supabase.rpc('reset_match', {
                    p_match_id: matchId,
                    p_team_ids: teamIdsToDelete,
                });

                if (error) {
                    useAlertStore.getState().addAlert({
                        message: error.message,
                        type: AlertType.ERROR,
                    });
                    set({ updateLoading: false });
                    return;
                }

                useAlertStore.getState().addAlert({
                    message: 'Match reset successfully',
                    type: AlertType.SUCCESS,
                });

                set({ updateLoading: false });
            },

            updateMatch: async (params: Partial<Match>) => {
                set({ updateLoading: true });

                const { id, ...updateData } = params;

                const { error } = await supabase
                    .from('matches')
                    .update(updateData)
                    .eq('id', id);

                if (error) {
                    useAlertStore.getState().addAlert({
                        message: error.message,
                        type: AlertType.ERROR
                    });
                }

                set({ updateLoading: false });
            },

            deleteMatch: async (matchId: string) => {
                useAlertStore.getState().addAlert({
                    message: 'Are you sure you want to delete this match?',
                    type: AlertType.WARNING,
                    duration: 10000,
                    handleAction: async () => {
                        set({ loading: true });

                        // Cerrar team/player canales ANTES de borrar para evitar
                        // las notificaciones en cascada de teams y players eliminados
                        useTeamStore.getState().unsubscribe();
                        usePlayerStore.getState().unsubscribe();

                        const { error } = await supabase
                            .from('matches')
                            .delete()
                            .eq('id', matchId);

                        if (error) {
                            useAlertStore.getState().addAlert({
                                message: error.message,
                                type: AlertType.ERROR
                            });
                            set({ loading: false });
                            return;
                        }

                        const channel = get().channel;
                        if (channel) channel.unsubscribe();

                        set((state) => ({
                            channel: null,
                            currentMatch: null,
                            matches: state.matches.filter((m) => m.id !== matchId),
                            loading: false,
                        }));

                        useAlertStore.getState().addAlert({
                            message: 'Match deleted successfully',
                            type: AlertType.SUCCESS
                        });
                    }
                });
            },

            subscribeToMatch: (matchId: string) => {
                const currentChannel = get().channel;
                if (currentChannel) {
                    currentChannel.unsubscribe();
                }

                set({ loading: true, currentMatch: null });

                const alreadyInList = get().matches.some((m) => m.id === matchId);

                // Canal realtime para el match (REPLICA IDENTITY FULL activo)
                const channel = supabase
                    .channel(`match:id=eq.${matchId}`)
                    .on(
                        "postgres_changes",
                        {
                            event: "*",
                            schema: "public",
                            table: "matches",
                            filter: `id=eq.${matchId}`,
                        },
                        (payload) => {
                            if (payload.eventType === "UPDATE") {
                                set((state) => ({
                                    currentMatch: state.currentMatch
                                        ? { ...state.currentMatch, ...(payload.new as Partial<Match>) }
                                        : (payload.new as Match),
                                    matches: state.matches.map((m) =>
                                        m.id === matchId
                                            ? { ...m, ...(payload.new as Partial<Match>) }
                                            : m
                                    ),
                                }));

                                useTagStore.getState().getLanes(payload.new.game);
                                useTagStore.getState().getMaps(payload.new.game);

                                useAlertStore.getState().addAlert({
                                    message: 'Match settings were updated',
                                    type: AlertType.INFO,
                                });
                            } else if (payload.eventType === "DELETE") {
                                // Cerrar team/player canales antes de que lleguen sus DELETE en cascada
                                useTeamStore.getState().unsubscribe();
                                usePlayerStore.getState().unsubscribe();

                                set((state) => ({
                                    currentMatch: null,
                                    matches: state.matches.filter((m) => m.id !== matchId),
                                }));
                                useAlertStore.getState().addAlert({
                                    message: 'This match was deleted',
                                    type: AlertType.INFO,
                                });
                            }
                        }
                    )
                    .subscribe();

                set({ channel });

                useTeamStore.getState().subscribeToMatch(matchId);
                usePlayerStore.getState().subscribeToMatch(matchId);

                // Carga inicial — también resuelve el caso de match compartido
                supabase
                    .from("matches")
                    .select('*')
                    .eq("id", matchId)
                    .single()
                    .then(({ data, error }) => {
                        if (error) {
                            useAlertStore.getState().addAlert({
                                message: 'Match not found or access denied',
                                type: AlertType.ERROR,
                            });
                            set({ loading: false });
                            return;
                        }

                        const match = data as Match;

                        if (match.game) {
                            useTagStore.getState().getLanes(match.game);
                            useTagStore.getState().getMaps(match.game);
                        }

                        set((state) => ({
                            currentMatch: match,
                            loading: false,
                            // Si era un match de otro usuario, agregarlo a la lista
                            matches: alreadyInList
                                ? state.matches
                                : (() => {
                                    useAlertStore.getState().addAlert({
                                        message: 'Subscribed to shared match',
                                        type: AlertType.SUCCESS,
                                    });
                                    return [match, ...state.matches];
                                })(),
                        }));
                    });
            },

            // Cierra el canal sin resetear currentMatch — para cleanup de useEffect
            closeChannel: () => {
                const channel = get().channel;
                if (channel) {
                    useTeamStore.getState().closeChannel();
                    usePlayerStore.getState().closeChannel();
                    channel.unsubscribe();
                    set({ channel: null });
                }
            },

            // Reset completo — para usar al desmontar la página
            unsubscribe: () => {
                const channel = get().channel;
                if (channel) channel.unsubscribe();
                set({ channel: null, currentMatch: null });
                useTeamStore.getState().unsubscribe();
                usePlayerStore.getState().unsubscribe();
            },
        }),
        {
            name: 'match-storage',
            partialize: (state) => ({
                currentMatch: state.currentMatch,
                matches: state.matches,
            }),
            onRehydrateStorage: () => (state) => {
                if (!state) return;

                // Validar si el match persistido sigue vigente
                const match = state.currentMatch;
                if (match) {
                    const isExpired = new Date(match.expires_at) <= new Date();
                    if (isExpired) {
                        console.log('[MatchStore] Match persistido expirado, limpiando...');
                        state.currentMatch = null;
                    } else {
                        console.log('[MatchStore] Match persistido vigente:', match.id);
                        // Match.tsx lo activará vía subscribeToMatch en su useEffect
                    }
                }

                // Refrescar la lista de matches en background
                state.fetchMatches();
            },
        }
    )
)