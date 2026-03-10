import { supabase } from "@/supabaseClient";
import { Tag } from "@/stores/tagStore";
import { AlertType, useAlertStore } from "@/stores/alertStore";
import { RealtimeChannel } from "@supabase/supabase-js";
import { create } from "zustand";

export interface MatchGame {
    id: string;
    game_number: number;
    match_id: string;
    map: Tag | null;
    winner_team_id: string | null;
    team_red_id: string | null;
    team_blue_id: string | null;
    created_at: string;
}

interface GameStore {
    games: MatchGame[];
    channel: RealtimeChannel | null;
    loading: boolean;
    updateLoading: boolean;

    updateGame: (params: {
        id: string;
        winner_team_id?: string | null;
        map?: Tag | null;
    }) => Promise<void>;
    subscribeToMatch: (matchId: string) => void;
    closeChannel: () => void;
    unsubscribe: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
    games: [],
    channel: null,
    loading: false,
    updateLoading: false,

    updateGame: async ({ id, ...updateData }) => {
        set({ updateLoading: true });

        const { data, error } = await supabase
            .from("games")
            .update(updateData)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            useAlertStore.getState().addAlert({
                message: "Error updating game",
                type: AlertType.ERROR,
            });
            set({ updateLoading: false });
            return;
        }

        // Actualiza optimistamente en el array local
        set((state) => ({
            games: state.games.map((g) =>
                g.id === id ? (data as MatchGame) : g
            ),
            updateLoading: false,
        }));

        useAlertStore.getState().addAlert({
            message: "Game updated successfully",
            type: AlertType.SUCCESS,
        });
    },

    subscribeToMatch: (matchId: string) => {
        // Desuscribirse del canal anterior si existe
        const currentChannel = get().channel;
        if (currentChannel) {
            currentChannel.unsubscribe();
        }

        set({ loading: true, games: [] });

        // Canal realtime filtrado por match_id
        const channel = supabase
            .channel(`games:match_id=eq.${matchId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "games",
                    filter: `match_id=eq.${matchId}`,
                },
                (payload) => {
                    console.log("[GameStore] Realtime event:", payload);

                    if (payload.eventType === "INSERT") {
                        set((state) => ({
                            games: [...state.games, payload.new as MatchGame]
                                .sort((a, b) => a.game_number - b.game_number),
                        }));
                    } else if (payload.eventType === "UPDATE") {
                        set((state) => ({
                            games: state.games.map((g) =>
                                g.id === (payload.new as MatchGame).id
                                    ? (payload.new as MatchGame)
                                    : g
                            ),
                        }));
                    } else if (payload.eventType === "DELETE") {
                        set((state) => ({
                            games: state.games.filter(
                                (g) => g.id !== (payload.old as MatchGame).id
                            ),
                        }));
                    }
                }
            )
            .subscribe();

        set({ channel });

        // Carga inicial de juegos para este match
        supabase
            .from("games")
            .select("*")
            .eq("match_id", matchId)
            .order("game_number", { ascending: true })
            .then(({ data, error }) => {
                if (error) {
                    console.error("[GameStore] Error loading games:", error);
                } else {
                    set({ games: (data as MatchGame[]) ?? [] });
                }
                set({ loading: false });
            });
    },

    // Cierra el canal — para cleanup de useEffect
    closeChannel: () => {
        const channel = get().channel;
        if (channel) {
            channel.unsubscribe();
            set({ channel: null });
        }
    },

    // Reset completo — para desmontar la página
    unsubscribe: () => {
        const channel = get().channel;
        if (channel) channel.unsubscribe();
        set({ channel: null, games: [] });
    },
}));