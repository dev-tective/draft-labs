import { CutOutBtnPrimary } from "@/components/CutOutBtn";
import { MatchGame, useGame, useGames, useUpdateGame } from "@/hooks/useGames";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { useMatchStore } from "@/stores/matchStore";
import { usePicksStore } from "@/stores/picksStore";
import { useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { TagSelect } from "../../components/TagSelect";
import { useTagsStore } from "@/stores/tagStore";
import { TeamDrag } from "./components/TeamDrag";
import { useMatch } from "@/hooks/useMatch";
import { DragDropProvider } from "@dnd-kit/react";

const GameContent = () => {
    const currentGameId = usePicksStore((state) => state.currentGameId);
    const currentMatchId = useMatchStore((state) => state.currentMatchId);
    const { data: game, isLoading, error } = useGame(currentGameId || '');
    const { data: match, isLoading: matchLoading, error: matchError } = useMatch(currentMatchId || '');
    const { mutateAsync: updateGame, isPending: updatePending } = useUpdateGame();
    const maps = useTagsStore((state) => state.maps);

    if (isLoading || matchLoading) {
        return <LoadingSpinner message="Loading game..." />;
    }

    if (error || !currentGameId || !game || !currentMatchId || matchError || !match) {
        return <ErrorMessage
            title="Error loading game"
            message={error?.message || matchError?.message || "Game info is missing"}
        />;
    }

    return (
        <DragDropProvider>
            <div className="flex flex-1 w-11/12 space-y-10 mx-auto py-6 md:py-10">
                <div className="w-full flex flex-col gap-6">
                    <div className="
                        flex flex-col xl:flex-row items-center justify-end
                        gap-4 pb-4 
                        border-b border-slate-700
                    ">
                        <TagSelect
                            nullable
                            icon="glyphs:crown-1-bold"
                            field="Winner"
                            options={match.teams.map((team) => ({ value: team.id, label: team.name }))}
                            initialValue={game.winner_team_id || null}
                            onUpdate={(winnerTeamId) => {
                                if (winnerTeamId === game.winner_team_id) return;

                                updateGame({
                                    id: currentGameId,
                                    match_id: currentMatchId,
                                    winner_team_id: winnerTeamId !== null ? winnerTeamId as string : null
                                })
                            }}
                            disabled={updatePending}
                        />
                        <TagSelect
                            nullable
                            icon="game-icons:treasure-map"
                            field="Map"
                            options={maps.map((map) => ({ value: map.id, label: map.name }))}
                            initialValue={game.map_id || null}
                            onUpdate={(mapId) =>
                                updateGame({ id: currentGameId, match_id: currentMatchId, map_id: mapId !== null ? Number(mapId) : null })
                            }
                            disabled={updatePending}
                        />
                    </div>
                    <div className="flex-1 flex items-center justify-between gap-4">
                        <div></div>
                        <div className="space-y-4">
                            {match?.teams.map((team) => (
                                <TeamDrag key={team.id} team={team} />
                            ))}
                        </div>
                        <div></div>
                    </div>
                </div>
            </div>
        </DragDropProvider>
    );
};

export const GamesPage = () => {
    const currentMatchId = useMatchStore((state) => state.currentMatchId);
    const { data: games = [], isLoading, error } = useGames(currentMatchId || '');
    const { selectGame, currentGameId, subscribeToGame, closeChannel } = usePicksStore();

    useEffect(() => {
        if (!currentGameId) return;
        subscribeToGame(currentGameId);

        return () => closeChannel();
    }, [currentGameId]);

    const btnRefs = useRef<Record<string, HTMLDivElement | null>>({});

    useEffect(() => {
        if (!currentGameId) return;

        const el = btnRefs.current[currentGameId];
        el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }, [currentGameId]);

    if (!currentMatchId) {
        return <Navigate to="/" replace />;
    }

    return (
        <>
            {isLoading ? (
                <LoadingSpinner message="Loading games..." />
            ) : error ? (
                <ErrorMessage title="Error loading games" message={error?.message} />
            ) : (
                <div className="min-h-full flex flex-col relative">
                    <div className="
                        sticky top-0 z-10
                        flex overflow-x-auto
                        w-full gap-4 p-4
                        bg-slate-950
                        border-b border-slate-700
                        [&::-webkit-scrollbar]:hidden
                    ">
                        {games.map((game: MatchGame) => (
                            <div
                                key={game.id}
                                className="w-full"
                                ref={(el) => { btnRefs.current[game.id] = el; }}
                            >
                                <CutOutBtnPrimary
                                    icon={game.id === currentGameId ?
                                        "game-icons:pointy-sword" :
                                        "game-icons:bouncing-sword"}
                                    text={`Game ${game.game_number}`}
                                    active={game.id === currentGameId}
                                    onClick={() => selectGame(game.id)}
                                />
                            </div>
                        ))}
                    </div>
                    <GameContent />
                </div>
            )}
        </>
    );
};
