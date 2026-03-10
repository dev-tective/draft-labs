import { supabase } from "@/supabaseClient";
import { RealtimeChannel } from "@supabase/supabase-js";
import { create } from "zustand";
import { AlertType, useAlertStore } from "./alertStore";

export interface Pick {
    id: string;
    player_id?: string | null;
    pick_order: number;
    is_locked: boolean;
    pick_hero_id?: number | null;
    ban_hero_id?: number | null;
    game_id: string;
    created_at: string;
    team_id: string;
}

interface PickStore {
    picks: Pick[];
    channel: RealtimeChannel | null;
    loading: boolean;

    subscribeToGame: (gameId: string) => void;
    swapGameTeams: (gameId: string) => Promise<void>;
    closeChannel: () => void;
    unsubscribe: () => void;
}

export const usePickStore = create<PickStore>((set, get) => ({
    picks: [],
    channel: null,
    loading: false,

    subscribeToGame: (gameId: string) => {
        // Desuscribirse del canal anterior si existe
        const currentChannel = get().channel;
        if (currentChannel) {
            currentChannel.unsubscribe();
        }

        set({ loading: true, picks: [] });

        // Canal realtime filtrado por game_id
        const channel = supabase
            .channel(`picks:game_id=eq.${gameId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "picks",
                    filter: `game_id=eq.${gameId}`,
                },
                (payload) => {
                    console.log("[PickStore] Realtime event:", payload);

                    if (payload.eventType === "INSERT") {
                        set((state) => ({
                            picks: [...state.picks, payload.new as Pick],
                        }));
                    } else if (payload.eventType === "UPDATE") {
                        set((state) => ({
                            picks: state.picks.map((p) =>
                                p.id === (payload.new as Pick).id
                                    ? (payload.new as Pick)
                                    : p
                            ),
                        }));
                    } else if (payload.eventType === "DELETE") {
                        set((state) => ({
                            picks: state.picks.filter(
                                (p) => p.id !== (payload.old as Pick).id
                            ),
                        }));
                    }
                }
            )
            .subscribe();

        set({ channel });

        // Carga inicial de picks para este juego
        supabase
            .from("picks")
            .select("*")
            .eq("game_id", gameId)
            .order("pick_order", { ascending: true })
            .then(({ data, error }) => {
                if (error) {
                    console.error("[PickStore] Error loading picks:", error);
                } else {
                    set({ picks: (data as Pick[]) ?? [] });
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

    // Reset completo — para usar al desmontar la página
    unsubscribe: () => {
        const channel = get().channel;
        if (channel) channel.unsubscribe();
        set({ channel: null, picks: [] });
    },

    swapGameTeams: async (gameId: string) => {
        set({ loading: true });
        const { error } = await supabase.rpc("swap_game_teams", {
            p_game_id: gameId,
        });

        if (error) {
            console.error("[PickStore] Error swapping game teams:", error);
            useAlertStore.getState().addAlert({
                message: "Error swapping game teams",
                type: AlertType.ERROR,
            });
            set({ loading: false });
            return;
        }

        useAlertStore.getState().addAlert({
            message: "Teams swapped successfully",
            type: AlertType.SUCCESS,
        });
        set({ loading: false });
    },
}));