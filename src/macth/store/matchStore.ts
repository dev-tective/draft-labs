import { create } from "zustand";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/supabaseClient";
import { AlertType, useAlertStore } from "@/stores/alertStore";
import { Match } from "@/macth/match.types";
import { useTeamStore } from "@/stores/teamStore";

interface MatchState {
    matches: Match[];
    channel: RealtimeChannel | null;
    loading: boolean;
    subscribeToRoom: (room_id: string) => void;
    closeChannel: () => void;
    unsubscribe: () => void;
}

const enrichMatch = (match: Match): Match => {
    const teams = useTeamStore.getState().teams;
    return {
        ...match,
        team_a: teams.find(t => t.id === match.team_a_id),
        team_b: teams.find(t => t.id === match.team_b_id),
    };
};

export const useMatchStore = create<MatchState>((set, get) => ({
    matches: [],
    channel: null,
    loading: false,

    subscribeToRoom: (room_id: string) => {
        const currentChannel = get().channel;
        if (currentChannel) currentChannel.unsubscribe();

        set({ loading: true, matches: [] });

        const alert = (message: string, type: AlertType) =>
            useAlertStore.getState().addAlert({ message, type });

        const channel = supabase
            .channel(`room_matches:${room_id}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "matches",
                    filter: `room_id=eq.${room_id}`,
                },
                (payload) => {
                    if (payload.eventType === "INSERT") {
                        const newMatch = enrichMatch(payload.new as Match);
                        set((state) => ({ matches: [...state.matches, newMatch] }));
                        alert(`Se ha creado un nuevo macth`, AlertType.INFO);

                    } else if (payload.eventType === "UPDATE") {
                        const updatedMatch = enrichMatch(payload.new as Match);
                        set((state) => ({
                            matches: state.matches.map((m) =>
                                m.id === updatedMatch.id ? { ...m, ...updatedMatch } : m
                            ),
                        }));
                        alert(`Un macth ha sido actualizado`, AlertType.INFO);

                    } else if (payload.eventType === "DELETE") {
                        const deletedMatch = payload.old as Match;
                        set((state) => ({
                            matches: state.matches.filter((m) => m.id !== deletedMatch.id),
                        }));
                        alert(`Un macth fue eliminado`, AlertType.INFO);
                    }
                }
            )
            .subscribe();

        set({ channel });

        supabase
            .from("matches")
            .select('*')
            .eq("room_id", room_id)
            .order("created_at", { ascending: true })
            .then(({ data, error }) => {
                if (error) {
                    console.error("[MatchStore] Error cargando encuentros:", error);
                } else {
                    const enrichedMatches = (data as Match[] || []).map(enrichMatch);
                    set({ matches: enrichedMatches });
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

    unsubscribe: () => {
        const channel = get().channel;
        if (channel) channel.unsubscribe();
        set({ channel: null, matches: [] });
    },
}));