import { supabase } from "@/supabaseClient";
import { AlertType, useAlertStore } from "@/stores/alertStore";
import { useTeamStore } from "@/stores/teamStore";
import { usePlayerStore } from "@/stores/playerStore";
import { RealtimeChannel } from "@supabase/supabase-js";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export enum Game {
    MLBB = 'MLBB',
}

export interface Match {
    id: string;
    best_of: number;
    bans_per_team: number;
    created_at: string;
    expires_at: string;
    game?: Game;
    user_id: string;
}

interface MatchState {
    matches: Match[];
    currentMatch: Match | null;
    channel: RealtimeChannel | null;
    loading: boolean;

    fetchMatches: () => Promise<void>;
    createMatch: (params: Partial<Match>) => Promise<void>;
    updateMatch: (params: Partial<Match>) => Promise<void>;
    deleteMatch: (matchId: string) => Promise<void>;
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

            fetchMatches: async () => {
                set({ loading: true });

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
                        message: 'Error creating match',
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

            updateMatch: async (params: Partial<Match>) => {
                const { id, ...updateData } = params;

                const { error } = await supabase
                    .from('matches')
                    .update(updateData)
                    .eq('id', id);

                if (error) {
                    useAlertStore.getState().addAlert({
                        message: 'Error updating match',
                        type: AlertType.ERROR
                    });
                    return;
                }

                // El canal realtime recibe el UPDATE y actualiza currentMatch automáticamente
                useAlertStore.getState().addAlert({
                    message: 'Match updated successfully',
                    type: AlertType.SUCCESS,
                });
            },

            deleteMatch: async (matchId: string) => {
                useAlertStore.getState().addAlert({
                    message: 'Are you sure you want to delete this match?',
                    type: AlertType.WARNING,
                    duration: 10000,
                    handleAction: async () => {
                        set({ loading: true });

                        const { error } = await supabase
                            .from('matches')
                            .delete()
                            .eq('id', matchId);

                        if (error) {
                            useAlertStore.getState().addAlert({
                                message: 'Error deleting match',
                                type: AlertType.ERROR
                            });
                            set({ loading: false });
                            return;
                        }

                        // Cortar el canal realtime y limpiar el match actual
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
                // Unsubscribe from previous channel if exists
                const currentChannel = get().channel;
                if (currentChannel) {
                    currentChannel.unsubscribe();
                }

                set({ loading: true, currentMatch: null });

                // Activar realtime en team y player store con el mismo matchId
                useTeamStore.getState().subscribeToMatch(matchId);
                usePlayerStore.getState().subscribeToMatch(matchId);

                // Create a new realtime channel filtered by match id
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
                            console.log("[MatchStore] Realtime event:", payload);

                            if (payload.eventType === "UPDATE") {
                                set((state) => ({
                                    currentMatch: state.currentMatch
                                        ? { ...state.currentMatch, ...(payload.new as Partial<Match>) }
                                        : (payload.new as Match),
                                }));
                            } else if (payload.eventType === "DELETE") {
                                set({ currentMatch: null });
                            }
                        }
                    )
                    .subscribe();

                set({ channel });

                // Load the initial match data
                supabase
                    .from("matches")
                    .select('*')
                    .eq("id", matchId)
                    .single()
                    .then(({ data, error }) => {
                        if (error) {
                            console.error("[MatchStore] Error loading match:", error);
                        } else {
                            set({ currentMatch: data as Match });
                        }
                        set({ loading: false });
                    });
            },

            // Cierra el canal sin resetear currentMatch — para cleanup de useEffect
            closeChannel: () => {
                const channel = get().channel;
                if (channel) {
                    channel.unsubscribe();
                    set({ channel: null });
                }
                useTeamStore.getState().closeChannel();
                usePlayerStore.getState().closeChannel();
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
            }),
            onRehydrateStorage: () => (state) => {
                // Al rehidratar el store (carga de página), traer los matches automáticamente
                state?.fetchMatches();
            },
        }
    )
)