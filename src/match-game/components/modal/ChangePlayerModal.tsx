import { useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import { Pick } from "@/match-game/match-game.types";
import { usePickAndBanStore } from "@/match-game/store/pickAndBanStore";
import { useTeamStore } from "@/stores/teamStore";

interface Props {
    pick: Pick;
    coords: { x: number, y: number };
    setShow: (show: boolean) => void;
}

export const ChangePlayerModal = ({ pick, coords, setShow }: Props) => {
    const { updatePick, loadingPickIds, bluePicks, redPicks } = usePickAndBanStore();

    const isLoading = loadingPickIds.has(pick.id);

    const { teams } = useTeamStore();
    const popupRef = useRef<HTMLDivElement>(null);
    const allPickedIds = new Set([
        ...bluePicks.map(p => p.player?.id),
        ...redPicks.map(p => p.player?.id)
    ]);

    const acceptablePlayers = teams
        .find(t => t.id === pick.team_id)?.players
        .filter(p => !allPickedIds.has(p.id)) || [];
    
    const handlePlayerChange = async (playerId: number) => {
        await updatePick(pick.id, { player_id: playerId });
        setShow(false);
    }

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
                setShow(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [setShow]);

    const isRightHalf = coords.x > window.innerWidth / 2;
    const isBottomHalf = coords.y > window.innerHeight / 2;

    const style: React.CSSProperties = {
        position: 'fixed' as const,
        zIndex: 50,
        [isRightHalf ? 'right' : 'left']: isRightHalf ? window.innerWidth - coords.x : coords.x,
        [isBottomHalf ? 'bottom' : 'top']: isBottomHalf ? window.innerHeight - coords.y : coords.y,
    };

    return (
        <div
            ref={popupRef}
            style={style}
            className="
                relative flex flex-col gap-1 p-2 bg-slate-900 border border-slate-700
                rounded-bl-xl rounded-tr-xl beveled-bl-tr 
                shadow-xl shadow-slate-950/50 min-w-40 z-50 overflow-hidden
            "
        >
            {isLoading && (
                <div className="absolute inset-0 bg-slate-950/50 flex items-center justify-center z-10 cursor-not-allowed">
                    <Icon icon="eos-icons:loading" className="text-cyan-400 text-2xl animate-spin" />
                </div>
            )}
            <div className="text-xs text-slate-400 mb-1 border-b border-slate-700 pb-1">
                Cambiar por
            </div>
            {acceptablePlayers && acceptablePlayers.length > 0 ? (
                acceptablePlayers.map(p => (
                    <button
                        key={p.id}
                        onClick={() => handlePlayerChange(p.id)}
                        disabled={isLoading}
                        className={`
                            text-left px-2 py-1.5 text-sm transition-colors rounded
                            ${isLoading ? 'text-slate-500 pointer-events-none' : 'text-slate-200 hover:bg-slate-800'}
                        `}
                    >
                        {p.nickname}
                    </button>
                ))
            ) : (
                <span className="text-sm text-slate-500 px-2 py-1">No hay más jugadores</span>
            )}
        </div>
    )
}