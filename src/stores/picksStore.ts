import { MatchGame } from "@/hooks/useGames";
import { supabase } from "@/supabaseClient";
import { RealtimeChannel } from "@supabase/supabase-js";
import { create } from "zustand";

export type TeamSide = "blue" | "red";

export interface Pick {
    id: string;
    team: TeamSide;
    player_id?: string | null;
    pick_order: number;
    is_locked: boolean;
    pick_hero_id?: number | null;
    ban_hero_id?: number | null;
    game_id: string;
    created_at: string;
}

interface PickStore {
    currentGameId: string | null;
    picks: Pick[];
    channel: RealtimeChannel | null;
    loading: boolean;

    setCurrentGameId: (matchGames: MatchGame[]) => void;
    selectGame: (gameId: string) => void;
    clearCurrentGameId: () => void;
    subscribeToGame: (gameId: string) => void;
    closeChannel: () => void;
    unsubscribe: () => void;
}

export const usePicksStore = create<PickStore>((set, get) => ({
    currentGameId: null,
    picks: [],
    channel: null,
    loading: false,

    setCurrentGameId: (matchGames: MatchGame[]) => {
        if (matchGames.length === 0) {
            set({ currentGameId: null });
            return;
        }

        const game = matchGames.find((game) => game.winner_team_id === null);

        if (!game) {
            set({ currentGameId: matchGames[0].id });
            return;
        }

        set({ currentGameId: game.id });
    },

    selectGame: (gameId: string) => set({ currentGameId: gameId }),

    clearCurrentGameId: () => set({ currentGameId: null }),

    subscribeToGame: (gameId: string) => {
        // Unsubscribe from previous channel if exists
        const currentChannel = get().channel;
        if (currentChannel) {
            currentChannel.unsubscribe();
        }

        set({ loading: true, picks: [] });

        // Create a new realtime channel filtered by game_id
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
                    console.log("[PicksStore] Realtime event:", payload);

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

        // Load initial picks for this game
        supabase
            .from("picks")
            .select("*")
            .eq("game_id", gameId)
            .order("pick_order", { ascending: true })
            .then(({ data, error }) => {
                if (error) {
                    console.error("[PicksStore] Error loading picks:", error);
                } else {
                    set({ picks: (data as Pick[]) ?? [] });
                }
                set({ loading: false });
            });
    },

    // Solo cierra el canal, sin tocar currentGameId — para usar en el cleanup del useEffect
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
        set({ channel: null, picks: [], currentGameId: null });
    },
}));