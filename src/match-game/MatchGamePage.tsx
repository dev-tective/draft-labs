import { useEffect, useRef, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { Icon } from "@iconify/react";

import { useMatchGames } from "./hooks/useMatchGames";
import { MatchGame } from "./match-game.types";
import { useStaffStore } from "@/staff/store/staffStore";
import { useMatchStore } from "@/macth/store/matchStore";
import { useHeroesStore } from "@/stores/heroesStore";
import { Hero } from "@/stores/heroesStore";
import { CutOutBtnPrimary } from "@/components/CutOutBtn";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { usePickAndBanStore } from "./store/pickAndBanStore";
import { Ban } from "./match-game.types";
import { WarningMessage } from "@/components/shared/WarningMessage";
import { DraftPanel } from "./components/DraftPanel";

// ─── Ban token ───────────────────────────────────────────────────────────────

interface BanTokenProps {
    ban: Ban;
    side: "blue" | "red";
}

const BanToken = ({ ban, side }: BanTokenProps) => {
    const hero = (ban as any).hero as Hero | null;
    const accent = side === "blue" ? "border-cyan-700" : "border-fuchsia-700";

    return (
        <div className={`
            relative w-10 h-10 rounded-md border ${accent}
            bg-slate-900/80 overflow-hidden flex-shrink-0
            flex items-center justify-center
        `}>
            {hero ? (
                <>
                    <img src={hero.image_slot_url} alt={hero.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center">
                        <Icon icon="mdi:close-thick" className="text-red-400 text-lg" />
                    </div>
                </>
            ) : (
                <Icon icon="mdi:minus" className="text-slate-600" />
            )}
        </div>
    );
};


// ─── Hero card ───────────────────────────────────────────────────────────────

const HeroCard = ({ hero }: { hero: Hero }) => (
    <div className="
        group flex flex-col items-center gap-1
        p-1.5 rounded-lg
        border border-slate-800 bg-slate-900/60
        hover:border-cyan-500/40 hover:bg-slate-800
        cursor-pointer transition-all
    ">
        <div className="relative w-full aspect-square rounded overflow-hidden">
            <img
                src={hero.image_slot_url}
                alt={hero.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
        </div>
        <span className="text-[10px] text-slate-400 text-center truncate w-full leading-tight">
            {hero.name}
        </span>
    </div>
);

// ─── Center hero panel ────────────────────────────────────────────────────────

const HeroesPanel = () => {
    const { heroes, setSearchQuery, searchQuery } = useHeroesStore();

    return (
        <div className="flex flex-col gap-3 w-72 flex-1">
            <div className="sticky top-0 bg-slate-950 pt-1 pb-2 z-10">
                <div className="relative">
                    <Icon
                        icon="mdi:magnify"
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                        type="text"
                        placeholder="Buscar héroe..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="
                            w-full pl-9 pr-4 py-2.5
                            bg-slate-900 border border-slate-700
                            rounded-lg text-sm text-slate-200
                            placeholder-slate-600
                            focus:outline-none focus:border-cyan-500/50
                            transition-colors
                        "
                    />
                </div>
            </div>

            <div className="grid grid-cols-4 gap-1.5 overflow-y-auto max-h-[calc(100vh-200px)] pr-1
                [&::-webkit-scrollbar]:w-1
                [&::-webkit-scrollbar-track]:bg-transparent
                [&::-webkit-scrollbar-thumb]:bg-slate-700
                [&::-webkit-scrollbar-thumb]:rounded-full
            ">
                {heroes.map(hero => (
                    <HeroCard key={hero.id} hero={hero} />
                ))}
            </div>
        </div>
    );
};

// ─── Game content ─────────────────────────────────────────────────────────────

const GameContent = ({ game }: { game: MatchGame }) => {
    const { bluePicks, redPicks, blueBans, redBans } = usePickAndBanStore();

    return (
        <div className="flex-1 flex justify-between gap-5 p-5">
            {/* Blue side */}
            <DraftPanel
                team={game.team_blue!}
                alternative={true}
                picks={bluePicks}
                bans={blueBans}
            />

            {/* Center: heroes */}
            <HeroesPanel />

            {/* Red side */}
            <DraftPanel
                team={game.team_red!}
                alternative={false}
                picks={redPicks}
                bans={redBans}
            />
        </div>
    );
};

// ─── Access denied ────────────────────────────────────────────────────────────

const AccessDenied = () => (
    <div className="flex flex-col items-center justify-center flex-1 gap-4 text-center py-20">
        <div className="
            flex items-center justify-center
            w-20 h-20 rounded-full
            bg-red-950/30 border border-red-500/30
        ">
            <Icon icon="mdi:shield-lock" className="text-4xl text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-200">Acceso Denegado</h2>
        <p className="text-slate-500 text-sm max-w-xs">
            No tienes staff activo en la sala asociada a este match. Solicita acceso al dueño de la sala.
        </p>
    </div>
);

// ─── Main page ────────────────────────────────────────────────────────────────

export const MatchGamePage = () => {
    const { id } = useParams<{ id: string }>();
    const matchId = id ? Number(id) : undefined;

    const { myStaff, myStaffLoading } = useStaffStore();
    const matches = useMatchStore(s => s.matches);
    const match = matches.find(m => m.id === matchId);

    const { games, loading } = useMatchGames(matchId);
    const { subscribeToGame, unsubscribe } = usePickAndBanStore();
    const [currentGameId, setCurrentGameId] = useState<number | null>(null);
    const btnRefs = useRef<Record<number, HTMLDivElement | null>>({});

    // Auto-select first pending or first game
    useEffect(() => {
        if (games.length === 0) return;
        const pending = games.find(g => !g.winner_team_id);
        setCurrentGameId(pending?.id ?? games[0].id);
    }, [games]);

    // Scroll active tab into view
    useEffect(() => {
        if (!currentGameId) return;
        btnRefs.current[currentGameId]?.scrollIntoView({
            behavior: "smooth",
            inline: "center",
            block: "nearest",
        });
    }, [currentGameId]);

    if (!matchId) return <Navigate to="/matches" replace />;

    // Guard: wait for staff data
    if (myStaffLoading) return <LoadingSpinner message="Verificando acceso..." />;

    // Guard: must have a staff entry for this match's room
    // const hasAccess = match
    //     ? myStaff.some(s => s.room_id === match.room_id)
    //     : false;

    // if (!hasAccess) return <AccessDenied />;

    const currentGame = games.find(g => g.id === currentGameId) ?? null;

    useEffect(() => {
        if (currentGame) {
            subscribeToGame(currentGame);
        }
        return () => {
            unsubscribe();
        };
    }, [currentGame?.id]);

    return (
        <div className="min-h-full flex flex-col relative">
            {/* Game tabs */}
            <div className="
                sticky top-0 z-10
                flex overflow-x-auto
                w-full gap-4 p-4
                bg-slate-950
                border-b border-slate-700
                [&::-webkit-scrollbar]:hidden
            ">
                {games.map(game => (
                    <div
                        key={game.id}
                        className="w-full"
                        ref={el => { btnRefs.current[game.id] = el; }}
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
                {games.length === 0 && !loading && (
                    <p className="text-slate-500 text-sm self-center pl-2">Sin juegos registrados</p>
                )}
            </div>

            {loading ? (
                <LoadingSpinner message="Cargando juegos..." />
            ) : !currentGame ? (
                <WarningMessage
                    title="No hay juegos"
                    message="Selecciona un match valido"
                />
            ) : (
                <GameContent game={currentGame} />
            )}
        </div>
    );
};