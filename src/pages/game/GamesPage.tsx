import { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";

import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { TagSelect } from "@/components/TagSelect";
import { CutOutBtnPrimary } from "@/components/CutOutBtn";
import { MatchGame, useGameStore } from "@/stores/gameStore";
import { usePickStore } from "@/stores/pickStore";
import { useMatchStore } from "@/macth/store/matchStore";
import { useTagStore } from "@/stores/tagStore";
import { useTeamStore } from "@/stores/teamStore";
import { DragDropProvider } from "@dnd-kit/react";
import { PicksBoard } from "./components/PicksBoard";

const GameContent = ({ game }: { game: MatchGame }) => {
    const { teams } = useTeamStore();
    const { updateGame, updateLoading } = useGameStore();
    const maps = useTagStore((state) => state.maps);
    const { picks, swapGameTeams, loading: picksLoading } = usePickStore();

    const bluePicks = picks.filter((pick) => pick.team_id === game.team_blue_id);
    const redPicks = picks.filter((pick) => pick.team_id === game.team_red_id);

    const winnersOptions = teams.filter((team) =>
        team.id === game.team_blue_id || team.id === game.team_red_id)
        .map((team) => ({ value: team.id, label: team.name }));

    return (
        <DragDropProvider>
            <div className="flex flex-1 w-11/12 mx-auto py-6 md:py-10">
                <div className="w-full flex flex-col gap-6">
                    <div className="
                        flex flex-col xl:flex-row items-center justify-end
                        gap-4 pb-4
                        border-b border-slate-700
                    ">
                        <div className="flex-1">
                            <CutOutBtnPrimary
                                icon="mdi:swap-horizontal"
                                text="Invert Sides"
                                onClick={() => swapGameTeams(game.id)}
                                disabled={updateLoading || picksLoading}
                            />
                        </div>

                        <TagSelect
                            nullable
                            icon="glyphs:crown-1-bold"
                            field="Winner"
                            options={winnersOptions}
                            initialValue={game.winner_team_id || null}
                            onUpdate={(winnerTeamId) => {
                                if (winnerTeamId === game.winner_team_id) return;
                                updateGame({
                                    id: game.id,
                                    winner_team_id: winnerTeamId !== null ? winnerTeamId as string : null,
                                });
                            }}
                            disabled={updateLoading}
                        />
                        <TagSelect
                            nullable
                            icon="game-icons:treasure-map"
                            field="Map"
                            options={maps.map((map) => ({ value: map.id, label: map.name }))}
                            initialValue={game.map?.id || null}
                            onUpdate={(mapId) => {
                                const found = mapId !== null
                                    ? maps.find((m) => m.id === mapId) ?? null
                                    : null;
                                updateGame({ id: game.id, map: found });
                            }}
                            disabled={updateLoading}
                        />
                    </div>

                    <PicksBoard picks={bluePicks} />
                    <PicksBoard picks={redPicks} />
                </div>
            </div>
        </DragDropProvider>
    );
};

export const GamesPage = () => {
    const currentMatch = useMatchStore((state) => state.currentMatch);

    const { games, loading, subscribeToMatch, closeChannel } = useGameStore();
    const { subscribeToGame, closeChannel: closePickChannel } = usePickStore();

    const [currentGameId, setCurrentGameId] = useState<string | null>(null);
    const btnRefs = useRef<Record<string, HTMLDivElement | null>>({});

    // Suscribirse a los juegos del match actual
    useEffect(() => {
        if (!currentMatch?.id) return;

        subscribeToMatch(currentMatch.id);

        return () => closeChannel();
    }, [currentMatch?.id]);

    // Seleccionar automáticamente el primer juego sin ganador (o el primero)
    useEffect(() => {
        if (games.length === 0) return;
        const pending = games.find((g) => g.winner_team_id === null);
        setCurrentGameId(pending?.id ?? games[0].id);
    }, [games]);

    // Suscribirse a los picks del juego seleccionado
    useEffect(() => {
        if (!currentGameId) return;
        subscribeToGame(currentGameId);
        return () => closePickChannel();
    }, [currentGameId]);

    // Scroll al botón del juego activo
    useEffect(() => {
        if (!currentGameId) return;
        const el = btnRefs.current[currentGameId];
        el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }, [currentGameId]);

    if (!currentMatch) {
        return <Navigate to="/" replace />;
    }

    const currentGame = games.find((g) => g.id === currentGameId) ?? null;

    return (
        <div className="min-h-full flex flex-col relative">
            {/* Barra de juegos */}
            <div className="
                sticky top-0 z-10
                flex overflow-x-auto
                w-full gap-4 p-4
                bg-slate-950
                border-b border-slate-700
                [&::-webkit-scrollbar]:hidden
            ">
                {games.map((game) => (
                    <div
                        key={game.id}
                        className="w-full"
                        ref={(el) => { btnRefs.current[game.id] = el; }}
                    >
                        <CutOutBtnPrimary
                            icon={game.id === currentGameId
                                ? "game-icons:pointy-sword"
                                : "game-icons:bouncing-sword"}
                            text={`Game ${game.game_number}`}
                            active={game.id === currentGameId}
                            onClick={() => setCurrentGameId(game.id)}
                        />
                    </div>
                ))}
            </div>

            {/* Contenido */}
            {!currentGame ? (
                loading ? (
                    <LoadingSpinner message="Loading game..." />
                ) : (
                    <ErrorMessage title="No game selected" message="No games available for this match." />
                )
            ) : (
                <GameContent game={currentGame} />
            )}
        </div>
    );
};
