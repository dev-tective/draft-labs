import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/supabaseClient";
import { MatchGame, Pick, Ban } from "../match-game.types";
import { AlertType, useAlertStore } from "@/stores/alertStore";
import { useTeamStore } from "@/stores/teamStore";
import { useHeroesStore } from "@/stores/heroesStore";

export const useMatchGames = (matchId?: number) => {
    const [loading, setLoading] = useState(false);
    const [games, setGames] = useState<MatchGame[]>([]);

    const enrichGame = useCallback((game: any): MatchGame => {
        const teams = useTeamStore.getState().teams;
        const { findHeroById } = useHeroesStore.getState();
        const allPlayers = teams.flatMap(t => t.players);

        const allPicks = (game.picks || []) as Pick[];
        const allBans = (game.bans || []) as Ban[];

        const enrichPick = (p: Pick) => ({
            ...p,
            hero: p.hero_id ? findHeroById(p.hero_id) : null,
            player: p.player_id 
                ? allPlayers.find(pl => String(pl.id) === String(p.player_id)) 
                : null,
        });

        const enrichBan = (b: Ban) => ({
            ...b,
            hero: b.hero_id ? findHeroById(b.hero_id) : null,
        });

        const picksBlue = allPicks
            .filter(p => String(p.team_id) === String(game.team_blue_id))
            .map(enrichPick)
            .sort((a, b) => a.pick_order - b.pick_order);

        const picksRed = allPicks
            .filter(p => String(p.team_id) === String(game.team_red_id))
            .map(enrichPick)
            .sort((a, b) => a.pick_order - b.pick_order);

        const bansBlue = allBans
            .filter(b => String(b.team_id) === String(game.team_blue_id))
            .map(enrichBan)
            .sort((a, b) => a.ban_order - b.ban_order);

        const bansRed = allBans
            .filter(b => String(b.team_id) === String(game.team_red_id))
            .map(enrichBan)
            .sort((a, b) => a.ban_order - b.ban_order);

        return {
            ...game,
            team_blue: teams.find(t => String(t.id) === String(game.team_blue_id)),
            team_red: teams.find(t => String(t.id) === String(game.team_red_id)),
            picksBlue,
            picksRed,
            bansBlue,
            bansRed,
        } as MatchGame;
    }, []);

    const fetchGames = useCallback(async (id: number) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('games')
                .select('*, picks(*), bans(*)')
                .eq('match_id', id)
                .order('game_number', { ascending: true });

            if (error) throw error;
            
            const enrichedGames = (data as MatchGame[] || []).map(enrichGame);
            setGames(enrichedGames);
        } catch (error: any) {
            useAlertStore.getState().addAlert({
                message: error.message,
                type: AlertType.ERROR
            });
        } finally {
            setLoading(false);
        }
    }, [enrichGame]);

    useEffect(() => {
        if (!matchId) return;

        fetchGames(matchId);

        const channel = supabase
            .channel(`match_${matchId}_games_draft`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "match_games",
                    filter: `match_id=eq.${matchId}`
                },
                (payload) => {
                    if (payload.eventType === "INSERT") {
                        const newGame = { ...payload.new, picks: [], bans: [] };
                        setGames(prev => [...prev, enrichGame(newGame)]);
                    } else if (payload.eventType === "UPDATE") {
                        setGames(prev => prev.map(g => {
                            if (g.id !== payload.new.id) return g;
                            const picks = [...(g.picksBlue || []), ...(g.picksRed || [])];
                            const bans = [...(g.bansBlue || []), ...(g.bansRed || [])];
                            return enrichGame({ ...payload.new, picks, bans });
                        }));
                    } else if (payload.eventType === "DELETE") {
                        setGames(prev => prev.filter(g => g.id !== payload.old.id));
                    }
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "picks"
                },
                (payload) => {
                    if (payload.eventType === "INSERT") {
                        const newPick = payload.new as Pick;
                        setGames(prev => prev.map(g => {
                            if (g.id !== newPick.game_id) return g;
                            const picks = [...(g.picksBlue || []), ...(g.picksRed || []), newPick];
                            const bans = [...(g.bansBlue || []), ...(g.bansRed || [])];
                            return enrichGame({ ...g, picks, bans });
                        }));
                    } else if (payload.eventType === "UPDATE") {
                        const updatedPick = payload.new as Pick;
                        setGames(prev => prev.map(g => {
                            if (g.id !== updatedPick.game_id) return g;
                            const currentPicks = [...(g.picksBlue || []), ...(g.picksRed || [])];
                            const picks = currentPicks.map(p => p.id === updatedPick.id ? updatedPick : p);
                            const bans = [...(g.bansBlue || []), ...(g.bansRed || [])];
                            return enrichGame({ ...g, picks, bans });
                        }));
                    } else if (payload.eventType === "DELETE") {
                        const deletedPick = payload.old as Pick;
                        setGames(prev => prev.map(g => {
                            const currentPicks = [...(g.picksBlue || []), ...(g.picksRed || [])];
                            if (!currentPicks.some(p => p.id === deletedPick.id)) return g;
                            const picks = currentPicks.filter(p => p.id !== deletedPick.id);
                            const bans = [...(g.bansBlue || []), ...(g.bansRed || [])];
                            return enrichGame({ ...g, picks, bans });
                        }));
                    }
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "bans"
                },
                (payload) => {
                    if (payload.eventType === "INSERT") {
                        const newBan = payload.new as Ban;
                        setGames(prev => prev.map(g => {
                            if (g.id !== newBan.game_id) return g;
                            const picks = [...(g.picksBlue || []), ...(g.picksRed || [])];
                            const bans = [...(g.bansBlue || []), ...(g.bansRed || []), newBan];
                            return enrichGame({ ...g, picks, bans });
                        }));
                    } else if (payload.eventType === "UPDATE") {
                        const updatedBan = payload.new as Ban;
                        setGames(prev => prev.map(g => {
                            if (g.id !== updatedBan.game_id) return g;
                            const picks = [...(g.picksBlue || []), ...(g.picksRed || [])];
                            const currentBans = [...(g.bansBlue || []), ...(g.bansRed || [])];
                            const bans = currentBans.map(b => b.id === updatedBan.id ? updatedBan : b);
                            return enrichGame({ ...g, picks, bans });
                        }));
                    } else if (payload.eventType === "DELETE") {
                        const deletedBan = payload.old as Ban;
                        setGames(prev => prev.map(g => {
                            const currentBans = [...(g.bansBlue || []), ...(g.bansRed || [])];
                            if (!currentBans.some(b => b.id === deletedBan.id)) return g;
                            const picks = [...(g.picksBlue || []), ...(g.picksRed || [])];
                            const bans = currentBans.filter(b => b.id !== deletedBan.id);
                            return enrichGame({ ...g, picks, bans });
                        }));
                    }
                }
            )
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [matchId, fetchGames, enrichGame]);

    return {
        games,
        loading,
        fetchGames
    };
};
