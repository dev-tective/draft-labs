import { supabase } from "@/supabaseClient";
import { AlertType, useAlertStore } from "@/stores/alertStore";
import { RealtimeChannel } from "@supabase/supabase-js";
import { create } from "zustand";
import { Tag } from "./tagStore";

export interface Player {
    id: string;
    nickname: string;
    team_id: string;
    image_url?: string;
    lane?: Tag;
    is_active: boolean;
    match_id: string;
    created_at: string;
}

interface PlayerState {
    players: Player[];
    channel: RealtimeChannel | null;
    loading: boolean;

    createPlayer: (params: Partial<Player>) => Promise<void>;
    updatePlayer: (params: Partial<Player>) => Promise<void>;
    deletePlayer: (playerId: string) => void;
    subscribeToMatch: (matchId: string) => void;
    closeChannel: () => void;
    unsubscribe: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
    players: [],
    channel: null,
    loading: false,

    createPlayer: async (params: Partial<Player>) => {
        const { data, error } = await supabase
            .from('players')
            .insert({
                nickname: params.nickname,
                team_id: params.team_id,
                image_url: params.image_url,
                match_id: params.match_id,
                lane: params.lane,
            })
            .select('*')
            .single();

        if (error) {
            useAlertStore.getState().addAlert({
                message: error.message,
                type: AlertType.ERROR,
            });
            return;
        }

        useAlertStore.getState().addAlert({
            message: `Player "${data.nickname}" created`,
            type: AlertType.SUCCESS,
        });

        console.log('[PlayerStore] Player created:', data);
    },

    updatePlayer: async (params: Partial<Player>) => {
        const {
            id,
            match_id,
            created_at: _created_at,
            ...updateData
        } = params;

        const { error } = await supabase
            .from('players')
            .update(updateData)
            .eq('id', id);

        if (error) {
            useAlertStore.getState().addAlert({
                message: error.message,
                type: AlertType.ERROR,
            });
        }
    },

    deletePlayer: (playerId: string) => {
        useAlertStore.getState().addAlert({
            message: 'Are you sure you want to delete this player?',
            type: AlertType.WARNING,
            duration: 10000,
            handleAction: async () => {
                const { error } = await supabase
                    .from('players')
                    .delete()
                    .eq('id', playerId);

                if (error) {
                    useAlertStore.getState().addAlert({
                        message: error.message,
                        type: AlertType.ERROR,
                    });
                    return;
                }

                useAlertStore.getState().addAlert({
                    message: 'Player deleted successfully',
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

        set({ loading: true, players: [] });

        // Create a new realtime channel filtered by match_id
        const channel = supabase
            .channel(`players:match_id=eq.${matchId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "players",
                    filter: `match_id=eq.${matchId}`,
                },
                (payload) => {
                    console.log("[PlayerStore] Realtime event:", payload);

                    if (payload.eventType === "INSERT") {
                        const player = payload.new as Player;
                        set((state) => ({
                            players: [...state.players, player],
                        }));
                        useAlertStore.getState().addAlert({
                            message: `Player "${player.nickname}" was added`,
                            type: AlertType.INFO,
                        });
                    } else if (payload.eventType === "UPDATE") {
                        const player = payload.new as Player;
                        set((state) => ({
                            players: state.players.map((p) =>
                                p.id === player.id ? player : p
                            ),
                        }));
                        useAlertStore.getState().addAlert({
                            message: `Player "${player.nickname}" was updated`,
                            type: AlertType.INFO,
                        });
                    } else if (payload.eventType === "DELETE") {
                        const player = payload.old as Player;
                        set((state) => ({
                            players: state.players.filter((p) => p.id !== player.id),
                        }));
                        useAlertStore.getState().addAlert({
                            message: `A player was removed`,
                            type: AlertType.INFO,
                        });
                    }
                }
            )
            .subscribe();

        set({ channel });

        // Load initial players for this match
        supabase
            .from("players")
            .select("*")
            .eq("match_id", matchId)
            .then(({ data, error }) => {
                if (error) {
                    console.error("[PlayerStore] Error loading players:", error);
                } else {
                    set({ players: (data as Player[]) ?? [] });
                }
                set({ loading: false });
            });
    },

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
        set({ channel: null, players: [] });
    },
}));