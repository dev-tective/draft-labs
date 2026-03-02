import { supabase } from "@/supabaseClient";
import { AlertType, useAlertStore } from "@/stores/alertStore";
import { RealtimeChannel } from "@supabase/supabase-js";
import { create } from "zustand";
import { Player } from "./playerStore";

export interface Team {
    id: string;
    name: string;
    acronym: string;
    logo_url?: string;
    coach?: string | null;
    created_at: string;
    match_id: string;
}

interface TeamState {
    teams: Team[];
    channel: RealtimeChannel | null;
    loading: boolean;

    createTeam: (params: Partial<Team>, players?: Partial<Player>[]) => Promise<void>;
    updateTeam: (params: Partial<Team>) => Promise<void>;
    deleteTeam: (teamId: string) => void;
    subscribeToMatch: (matchId: string) => void;
    closeChannel: () => void;
    unsubscribe: () => void;
}

export const useTeamStore = create<TeamState>((set, get) => ({
    teams: [],
    channel: null,
    loading: false,

    createTeam: async (params: Partial<Team>, players?: Partial<Player>[]) => {
        const { data, error } = await supabase.rpc('create_team_with_players', {
            p_match_id: params.match_id,
            p_name: params.name,
            p_acronym: params.acronym,
            p_logo_url: params.logo_url,
            p_coach: params.coach,
            p_players: players || [],
        });

        if (error) {
            useAlertStore.getState().addAlert({
                message: 'Error creating team',
                type: AlertType.ERROR,
            });
            return;
        }

        // El canal realtime recibe el INSERT y actualiza teams[] automáticamente
        useAlertStore.getState().addAlert({
            message: 'Team created successfully',
            type: AlertType.SUCCESS,
        });

        console.log('[TeamStore] Team created:', data);
    },

    updateTeam: async (params: Partial<Team>) => {
        const { id, match_id: _match_id, ...updateData } = params;

        const { error } = await supabase
            .from('teams')
            .update(updateData)
            .eq('id', id);

        if (error) {
            useAlertStore.getState().addAlert({
                message: 'Error updating team',
                type: AlertType.ERROR,
            });
            return;
        }

        // El canal realtime recibe el UPDATE y actualiza teams[] automáticamente
        useAlertStore.getState().addAlert({
            message: 'Team updated successfully',
            type: AlertType.SUCCESS,
        });
    },

    deleteTeam: (teamId: string) => {
        useAlertStore.getState().addAlert({
            message: 'Are you sure you want to delete this team?',
            type: AlertType.WARNING,
            duration: 10000,
            handleAction: async () => {
                const { error } = await supabase
                    .from('teams')
                    .delete()
                    .eq('id', teamId);

                if (error) {
                    useAlertStore.getState().addAlert({
                        message: 'Error deleting team',
                        type: AlertType.ERROR,
                    });
                    return;
                }

                // El canal realtime recibe el DELETE y actualiza teams[] automáticamente
                useAlertStore.getState().addAlert({
                    message: 'Team deleted successfully',
                    type: AlertType.SUCCESS,
                });
            },
        });
    },

    subscribeToMatch: (matchId: string) => {
        // Unsubscribe from previous channel if exists
        const currentChannel = get().channel;
        if (currentChannel) {
            currentChannel.unsubscribe();
        }

        set({ loading: true, teams: [] });

        // Create a new realtime channel filtered by match_id
        const channel = supabase
            .channel(`teams:match_id=eq.${matchId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "teams",
                    filter: `match_id=eq.${matchId}`,
                },
                (payload) => {
                    console.log("[TeamStore] Realtime event:", payload);

                    if (payload.eventType === "INSERT") {
                        set((state) => ({
                            teams: [...state.teams, payload.new as Team],
                        }));
                    } else if (payload.eventType === "UPDATE") {
                        set((state) => ({
                            teams: state.teams.map((t) =>
                                t.id === (payload.new as Team).id
                                    ? (payload.new as Team)
                                    : t
                            ),
                        }));
                    } else if (payload.eventType === "DELETE") {
                        set((state) => ({
                            teams: state.teams.filter(
                                (t) => t.id !== (payload.old as Team).id
                            ),
                        }));
                    }
                }
            )
            .subscribe();

        set({ channel });

        // Load initial teams for this match
        supabase
            .from("teams")
            .select("*")
            .eq("match_id", matchId)
            .order("created_at", { ascending: true })
            .then(({ data, error }) => {
                if (error) {
                    console.error("[TeamStore] Error loading teams:", error);
                } else {
                    set({ teams: (data as Team[]) ?? [] });
                }
                set({ loading: false });
            });
    },

    // Cierra el canal sin limpiar teams — para cleanup de useEffect
    closeChannel: () => {
        const channel = get().channel;
        if (channel) {
            channel.unsubscribe();
            set({ channel: null });
        }
    },

    // Reset completo — para usar al desmontar la página
    unsubscribe: () => {
        const channel = get().channel;
        if (channel) channel.unsubscribe();
        set({ channel: null, teams: [] });
    },
}));