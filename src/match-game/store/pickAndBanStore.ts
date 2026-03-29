import { create } from "zustand";
import { Pick, Ban, MatchGame } from "../match-game.types";
import { supabase } from "@/supabaseClient";
import { AlertType, useAlertStore } from "@/stores/alertStore";
import { RealtimeChannel } from "@supabase/supabase-js";
import { useHeroesStore } from "@/stores/heroesStore";
import { useTeamStore } from "@/stores/teamStore";

interface PickAndBanState {
    bluePicks: Pick[];
    redPicks: Pick[];
    blueBans: Ban[];
    redBans: Ban[];
    channel: RealtimeChannel | null;
    loading: boolean;
    loadingPickIds: Set<number>;
    loadingBanIds: Set<number>;
    setPickLoading: (id: number, val: boolean) => void;
    setBanLoading: (id: number, val: boolean) => void;
    updatePick: (pickId: number, pickData: Partial<Pick>) => Promise<void>;
    updateBan: (banId: number, banData: Partial<Ban>) => Promise<void>;
    subscribeToGame: (game: MatchGame) => void;
    closeChannel: () => void;
    unsubscribe: () => void;
}

export const usePickAndBanStore = create<PickAndBanState>((set, get) => ({
    bluePicks: [],
    redPicks: [],
    blueBans: [],
    redBans: [],
    loading: false,
    loadingPickIds: new Set(),
    loadingBanIds: new Set(),
    channel: null,

    setPickLoading: (id: number, val: boolean) => {
        const { loadingPickIds } = get();
        const ids = new Set(loadingPickIds);
        val ? ids.add(id) : ids.delete(id);
        set({ loadingPickIds: ids });
    },

    setBanLoading: (id: number, val: boolean) => {
        const { loadingBanIds } = get();
        const ids = new Set(loadingBanIds);
        val ? ids.add(id) : ids.delete(id);
        set({ loadingBanIds: ids });
    },

    updatePick: async (pickId: number, pickData: Partial<Pick>) => {
        if (!pickId) return;
        get().setPickLoading(pickId, true);

        const {
            id: _id,
            created_at: _created_at,
            hero: _hero,
            player: _player,
            team_id: _team_id,
            game_id: _game_id,
            ...updateData
        } = pickData as any;

        try {
            const { error } = await supabase
                .from('picks')
                .update(updateData)
                .eq('id', pickId);

            if (error) throw error;
        } catch (error: any) {
            useAlertStore.getState().addAlert({ message: error.message, type: AlertType.ERROR });
            throw error;
        } finally {
            get().setPickLoading(pickId, false);
        }
    },

    updateBan: async (banId: number, banData: Partial<Ban>) => {
        if (!banId) return;
        get().setBanLoading(banId, true);

        const {
            id: _id,
            created_at: _created_at,
            hero: _hero,
            team_id: _team_id,
            game_id: _game_id,
            ...updateData
        } = banData as any;

        try {
            const { error } = await supabase
                .from('bans')
                .update(updateData)
                .eq('id', banId);

            if (error) throw error;
        } catch (error: any) {
            useAlertStore.getState().addAlert({ message: error.message, type: AlertType.ERROR });
            throw error;
        } finally {
            get().setBanLoading(banId, false);
        }
    },

    subscribeToGame: (game: MatchGame) => {
        const currentChannel = get().channel;
        if (currentChannel) currentChannel.unsubscribe();

        set({
            loading: true,
            bluePicks: [],
            redPicks: [],
            blueBans: [],
            redBans: []
        });

        const enrichPick = (pick: Pick): Pick => {
            const findHeroById = useHeroesStore.getState().findHeroById;
            const teams = useTeamStore.getState().teams;
            const hero = findHeroById(pick.hero_id) ?? undefined;
            const team = teams.find(t => t.id === pick.team_id);
            const player = team?.players.find(p => p.id === pick.player_id) ?? undefined;
            return { ...pick, hero, player } as Pick;
        };

        const enrichBan = (ban: Ban): Ban => {
            const findHeroById = useHeroesStore.getState().findHeroById;
            const hero = findHeroById(ban.hero_id) ?? undefined;
            return { ...ban, hero } as Ban;
        };

        const updateItemInTargetArray = <T extends { id: number, team_id: number }>(
            arrayBlue: T[], 
            arrayRed: T[], 
            updatedItem: T
        ) => {
            // Remove from both, then add to the correct one
            const filteredBlue = arrayBlue.filter(item => item.id !== updatedItem.id);
            const filteredRed = arrayRed.filter(item => item.id !== updatedItem.id);
            
            const sortFn = (a: any, b: any) => {
                if ('pick_order' in a) return (a.pick_order || 0) - (b.pick_order || 0);
                if ('ban_order' in a) return (a.ban_order || 0) - (b.ban_order || 0);
                return 0;
            };

            if (updatedItem.team_id === game.team_blue_id) {
                // If it belongs to blue, add it and sort
                filteredBlue.push(updatedItem);
                filteredBlue.sort(sortFn);
            } else if (updatedItem.team_id === game.team_red_id) {
                filteredRed.push(updatedItem);
                filteredRed.sort(sortFn);
            }
            return { blue: filteredBlue, red: filteredRed };
        };

        const channel = supabase
            .channel(`game_picks_bans:${game.id}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "picks",
                    filter: `game_id=eq.${game.id}`,
                },
                (payload) => {
                    if (payload.eventType === "UPDATE" || payload.eventType === "INSERT") {
                        const updatedPick = enrichPick(payload.new as Pick);
                        set((state) => {
                            const { blue, red } = updateItemInTargetArray(state.bluePicks, state.redPicks, updatedPick);
                            return { bluePicks: blue, redPicks: red };
                        });
                    } else if (payload.eventType === "DELETE") {
                        set(state => ({
                            bluePicks: state.bluePicks.filter(p => p.id !== payload.old.id),
                            redPicks: state.redPicks.filter(p => p.id !== payload.old.id)
                        }));
                    }
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "bans",
                    filter: `game_id=eq.${game.id}`,
                },
                (payload) => {
                    if (payload.eventType === "UPDATE" || payload.eventType === "INSERT") {
                        const updatedBan = enrichBan(payload.new as Ban);
                        set((state) => {
                            const { blue, red } = updateItemInTargetArray(state.blueBans, state.redBans, updatedBan);
                            return { blueBans: blue, redBans: red };
                        });
                    } else if (payload.eventType === "DELETE") {
                        set(state => ({
                            blueBans: state.blueBans.filter(b => b.id !== payload.old.id),
                            redBans: state.redBans.filter(b => b.id !== payload.old.id)
                        }));
                    }
                }
            )
            .subscribe();

        set({ channel });

        supabase
            .from("picks")
            .select('*')
            .eq("game_id", game.id)
            .order("pick_order", { ascending: true })
            .then(({ data, error }) => {
                if (error) {
                    console.error("[PickAndBanStore] Error cargando picks:", error);
                } else {
                    const allPicks = (data as Pick[] || []).map(enrichPick);
                    set({ 
                        bluePicks: allPicks.filter(p => p.team_id === game.team_blue_id),
                        redPicks: allPicks.filter(p => p.team_id === game.team_red_id)
                    });
                }
            });

        supabase
            .from("bans")
            .select('*')
            .eq("game_id", game.id)
            .order("ban_order", { ascending: true })
            .then(({ data, error }) => {
                if (error) {
                    console.error("[PickAndBanStore] Error cargando bans:", error);
                } else {
                    const allBans = (data as Ban[] || []).map(enrichBan);
                    set({ 
                        blueBans: allBans.filter(b => b.team_id === game.team_blue_id),
                        redBans: allBans.filter(b => b.team_id === game.team_red_id)
                    });
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
        set({ channel: null, bluePicks: [], redPicks: [], blueBans: [], redBans: [] });
    },
}));
