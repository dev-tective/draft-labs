import { useEffect, useRef } from "react";
import { useMatchStore } from "./store/matchStore";
import { useRoomStore } from "@/room/store/roomStore";
import { ModalRef } from "@/layout/ModalLayout";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { WarningMessage } from "@/components/shared/WarningMessage";
import { CutOutBtnPrimary } from "@/components/CutOutBtn";
import { StartMatchModal } from "@/components/modals/StartMatchModal";
import { MatchCard } from "./components/MatchCard";
import { Match } from "./match.types";

interface MatchSectionProps {
    title: string;
    matches: Match[];
    color: "cyan" | "slate" | "fuchsia";
    isLive?: boolean;
}

const MatchSection = ({ title, matches, color, isLive }: MatchSectionProps) => {
    const colorClasses = {
        cyan: {
            text: "text-cyan-400",
            badge: "bg-cyan-950/50 border-cyan-500/30 text-cyan-400",
            dot: "bg-cyan-500"
        },
        slate: {
            text: "text-slate-400",
            badge: "bg-slate-900 border-slate-700 text-slate-400",
            dot: "bg-slate-400"
        },
        fuchsia: {
            text: "text-fuchsia-400",
            badge: "bg-fuchsia-950/30 border-fuchsia-500/30 text-fuchsia-400",
            dot: "bg-fuchsia-500"
        }
    };

    const theme = colorClasses[color];

    if (matches.length === 0) return null;

    return (
        <div className="space-y-4">
            <h2 className={`flex items-center gap-3 text-sm md:text-base font-bold uppercase tracking-widest ${theme.text} border-b border-slate-800 pb-2`}>
                {isLive && <div className={`w-2.5 h-2.5 rounded-full ${theme.dot} animate-pulse`} />}
                {title} ({matches.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {matches.map(match => (
                    <MatchCard key={match.id} match={match} />
                ))}
            </div>
        </div>
    );
};

export const MatchPage = () => {
    const { matches, subscribeToRoom } = useMatchStore();
    const { roomStaffLoading, activeRoom } = useRoomStore();
    const startMatchModalRef = useRef<ModalRef>(null);

    useEffect(() => {
        if (activeRoom) {
            console.log("Subscribing to matches for room:", activeRoom.id);
            subscribeToRoom(activeRoom.id);
        }

        return () => {
            useMatchStore.getState().unsubscribe();
        };
    }, [activeRoom?.id, subscribeToRoom]);

    const liveMatches = matches.filter(m => m.is_live && !m.finished);
    const pendingMatches = matches.filter(m => !m.is_live && !m.finished);
    const finishedMatches = matches.filter(m => m.finished);

    return (
        <div className="min-h-full flex flex-col relative w-full overflow-y-auto">
            <StartMatchModal ref={startMatchModalRef} />
            {/* Top Toolbar */}
            <div className="
                sticky top-0 z-10
                flex flex-col lg:flex-row items-center justify-between
                w-full gap-4 p-4 lg:px-8
                bg-slate-950/90 backdrop-blur-md
                border-b border-slate-800 shadow-xl
            ">
                <div className="lg:flex flex-col hidden">
                    <h1 className="text-xl font-bold uppercase tracking-widest text-slate-200">Matches</h1>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
                        {matches.length} matches en Total
                    </p>
                </div>

                <div className="w-full lg:w-auto min-w-70">
                    <CutOutBtnPrimary
                        icon="material-symbols:swords"
                        text="Iniciar Match"
                        onClick={() => startMatchModalRef.current?.open()}
                    />
                </div>
            </div>

            {/* Content Area */}
            <div className="flex flex-col flex-1 w-full mx-auto px-4 py-8 max-w-7xl">
                {roomStaffLoading ? (
                    <LoadingSpinner message="Cargando sala..." />
                ) : !activeRoom ? (
                    <WarningMessage
                        title="Sala no encontrada"
                        message="No se encontró una sala activa. Crea una nueva sala o únete a una existente en la pestaña 'Sala'."
                    />
                ) : matches.length === 0 ? (
                    <div className="flex flex-col items-center justify-center flex-1 h-full opacity-60">
                         <WarningMessage
                            title="Sin Encuentros"
                            message="No hay matches registrados. Da click en 'Crear Match' para comenzar."
                        />
                    </div>
                ) : (
                    <div className="flex flex-col gap-12 pb-20">
                        <MatchSection 
                            title="en vivo" 
                            matches={liveMatches} 
                            color="cyan" 
                            isLive 
                        />
                        <MatchSection 
                            title="en espera" 
                            matches={pendingMatches} 
                            color="slate" 
                        />
                        <MatchSection 
                            title="finalizado" 
                            matches={finishedMatches} 
                            color="slate" 
                        />
                    </div>
                )}
            </div>
        </div>
    );
};