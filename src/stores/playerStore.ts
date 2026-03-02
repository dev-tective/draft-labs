import { supabase } from "@/supabaseClient";
import { AlertType, useAlertStore } from "@/stores/alertStore";
import { RealtimeChannel } from "@supabase/supabase-js";
import { create } from "zustand";
import { Tag } from "./tagsStore";

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
                message: 'Error creating player',
                type: AlertType.ERROR,
            });
            return;
        }

        // El canal realtime recibe el INSERT y actualiza players[] automáticamente
        useAlertStore.getState().addAlert({
            message: 'Player created successfully',
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
                message: 'Error updating player',
                type: AlertType.ERROR,
            });
            return;
        }

        // El canal realtime recibe el UPDATE y actualiza players[] automáticamente
        useAlertStore.getState().addAlert({
            message: 'Player updated successfully',
            type: AlertType.SUCCESS,
        });
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
                        message: 'Error deleting player',
                        type: AlertType.ERROR,
                    });
                    return;
                }

                // El canal realtime recibe el DELETE y actualiza players[] automáticamente
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
                        set((state) => ({
                            players: [...state.players, payload.new as Player],
                        }));
                    } else if (payload.eventType === "UPDATE") {
                        set((state) => ({
                            players: state.players.map((p) =>
                                p.id === (payload.new as Player).id
                                    ? (payload.new as Player)
                                    : p
                            ),
                        }));
                    } else if (payload.eventType === "DELETE") {
                        set((state) => ({
                            players: state.players.filter(
                                (p) => p.id !== (payload.old as Player).id
                            ),
                        }));
                    }
                }
            )
            .subscribe();

        set({ channel });

        // Load initial players for this match
        supabase
            .from("players")
            .select("*, lanes(*)")
            .eq("match_id", matchId)
            .order("created_at", { ascending: true })
            .then(({ data, error }) => {
                if (error) {
                    console.error("[PlayerStore] Error loading players:", error);
                } else {
                    set({ players: (data as Player[]) ?? [] });
                }
                set({ loading: false });
            });
    },

    // Cierra el canal sin limpiar players — para cleanup de useEffect
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