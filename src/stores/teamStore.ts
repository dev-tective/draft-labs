
import { supabase } from "@/supabaseClient";
import { AlertType, useAlertStore } from "@/stores/alertStore";
import { RealtimeChannel } from "@supabase/supabase-js";
import { create } from "zustand";
import { Tag } from "./tagStore";

export interface Player {
    id: number;
    nickname: string;
    team_id: number;
    room_id: string;
    profile_url?: string | null;
    lane?: Tag;
    is_active: boolean;
    order: number;
    created_at: string;
}

export interface Team {
    id: number;
    name: string;
    acronym?: string;
    logo_url?: string;
    coach?: string | null;
    created_at: string;
    room_id: string;
    players: Player[];
}

interface TeamState {
    teams: Team[];
    channel: RealtimeChannel | null;
    loading: boolean;
    loadingTeamIds: Set<number>;   // 👈 granular
    subscribeToRoom: (room_id: string) => void;
    closeChannel: () => void;
    unsubscribe: () => void;
    createPlayer: (player: Partial<Player>) => Promise<void>;
    updatePlayer: (player: Partial<Player>) => Promise<void>;
    deletePlayer: (playerId: number, teamId: number) => void;  // 👈 teamId necesario
}

export const useTeamStore = create<TeamState>((set, get) => {

    // Helper interno — no expuesto en el estado
    const setTeamLoading = (teamId: number, val: boolean) => {
        set((s) => {
            const ids = new Set(s.loadingTeamIds);
            val ? ids.add(teamId) : ids.delete(teamId);
            return { loadingTeamIds: ids };
        });
    };

    return {
        teams: [],
        channel: null,
        loading: false,
        loadingTeamIds: new Set(),

        createPlayer: async (player: Partial<Player>) => {
            const alert = useAlertStore.getState().addAlert;
            setTeamLoading(player.team_id!, true);

            try {
                const { error } = await supabase
                    .from('players')
                    .insert({
                        nickname: player.nickname,
                        team_id: player.team_id,
                        room_id: player.room_id,
                        profile_url: player.profile_url ?? null,
                        lane: player.lane ?? null,
                        order: player.order ?? null,
                        is_active: player.is_active ?? false,
                    })
                    .select('*')
                    .single();

                if (error) throw error;

                alert({ message: "Jugador creado correctamente", type: AlertType.SUCCESS });
            } catch (error: any) {
                alert({ message: error.message, type: AlertType.ERROR });
            } finally {
                setTeamLoading(player.team_id!, false);
            }
        },

        updatePlayer: async (player: Partial<Player>) => {
            const alert = useAlertStore.getState().addAlert;
            setTeamLoading(player.team_id!, true);

            try {
                const {
                    id,
                    room_id: _room_id,
                    team_id: _team_id,
                    created_at: _created_at,
                    ...updateData
                } = player;

                const { error } = await supabase
                    .from('players')
                    .update(updateData)
                    .eq('id', id);

                if (error) throw error;

                alert({ message: "Jugador actualizado correctamente", type: AlertType.SUCCESS });
            } catch (error: any) {
                alert({ message: error.message, type: AlertType.ERROR });
            } finally {
                setTeamLoading(player.team_id!, false);
            }
        },

        // 👇 teamId ahora requerido para poder liberar el loading correcto
        deletePlayer: (playerId: number, teamId: number) => {
            useAlertStore.getState().addAlert({
                message: '¿Estás seguro de que quieres eliminar este jugador?',
                type: AlertType.WARNING,
                handleAction: async () => {
                    setTeamLoading(teamId, true);

                    try {
                        const { error } = await supabase
                            .from('players')
                            .delete()
                            .eq('id', playerId);

                        if (error) throw error;

                        useAlertStore.getState().addAlert({
                            message: 'El jugador fue eliminado correctamente',
                            type: AlertType.SUCCESS,
                        });
                    } catch (error: any) {
                        useAlertStore.getState().addAlert({
                            message: error.message,
                            type: AlertType.ERROR,
                        });
                    } finally {
                        setTeamLoading(teamId, false);
                    }
                },
            });
        },

        subscribeToRoom: (room_id: string) => {
            const currentChannel = get().channel;
            if (currentChannel) currentChannel.unsubscribe();

            set({ loading: true, teams: [] });

            const alert = (message: string, type: AlertType) =>
                useAlertStore.getState().addAlert({ message, type });

            const channel = supabase
                .channel(`room:${room_id}`)
                .on(
                    "postgres_changes",
                    {
                        event: "*",
                        schema: "public",
                        table: "teams",
                        filter: `room_id=eq.${room_id}`,
                    },
                    (payload) => {
                        if (payload.eventType === "INSERT") {
                            const team = { ...payload.new as Team, players: [] };
                            set((state) => ({ teams: [...state.teams, team] }));
                            alert(`El equipo "${team.name}" fue añadido`, AlertType.INFO);

                        } else if (payload.eventType === "UPDATE") {
                            const updated = payload.new as Team;
                            set((state) => ({
                                teams: state.teams.map((t) =>
                                    t.id === updated.id ? { ...updated, ...t } : t
                                ),
                            }));
                            alert(`El equipo "${updated.name}" fue actualizado`, AlertType.INFO);

                        } else if (payload.eventType === "DELETE") {
                            const deleted = payload.old as Team;
                            set((state) => ({
                                teams: state.teams.filter((t) => t.id !== deleted.id),
                            }));
                            alert(`Un equipo fue eliminado`, AlertType.INFO);
                        }
                    }
                )
                .on(
                    "postgres_changes",
                    {
                        event: "*",
                        schema: "public",
                        table: "players",
                        filter: `room_id=eq.${room_id}`,
                    },
                    (payload) => {
                        if (payload.eventType === "INSERT") {
                            const player = payload.new as Player;
                            set((state) => ({
                                teams: state.teams.map((t) =>
                                    t.id === player.team_id
                                        ? { ...t, players: [...t.players, player] }
                                        : t
                                ),
                            }));

                        } else if (payload.eventType === "UPDATE") {
                            const player = payload.new as Player;
                            set((state) => ({
                                teams: state.teams.map((t) =>
                                    t.id === player.team_id
                                        ? {
                                            ...t,
                                            players: t.players.map((p) =>
                                                p.id === player.id ? player : p
                                            ),
                                        }
                                        : t
                                ),
                            }));
                        } else if (payload.eventType === "DELETE") {
                            const player = payload.old as Player;
                            set((state) => ({
                                teams: state.teams.map((t) =>
                                    t.id === player.team_id
                                        ? {
                                            ...t,
                                            players: t.players.filter((p) => p.id !== player.id),
                                        }
                                        : t
                                ),
                            }));
                        }
                    }
                )
                .subscribe();

            set({ channel });

            supabase
                .from("teams")
                .select(`*, players(*)`)
                .eq("room_id", room_id)
                .order("created_at", { ascending: true })
                .then(({ data, error }) => {
                    if (error) console.error("[TeamStore] Error cargando equipos:", error);
                    else set({ teams: (data as Team[]) ?? [] });
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
            set({ channel: null, teams: [] });
        },
    };
});