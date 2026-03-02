import { forwardRef, useState } from "react";
import { Icon } from "@iconify/react";
import { ModalLayout, ModalRef } from "@/layout/ModalLayout";
import { useMatches } from "@/hooks/useMatch";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { useMatchStore } from "@/stores/matchStore";

export const JoinLobbyModal = forwardRef<ModalRef, {}>((_props, ref) => {
    const [manualId, setManualId] = useState("");
    const { data: matches, isLoading, error } = useMatches();
    const { setCurrentMatchId } = useMatchStore();

    const handleJoinById = () => {
        if (!manualId.trim()) return;

        setCurrentMatchId(manualId.trim());

        if (ref && typeof ref !== 'function' && ref.current) {
            ref.current.close();
        }
    };

    const handleJoinMatch = (matchId: string) => {
        if (ref && typeof ref !== 'function' && ref.current) {
            ref.current.close();
        }

        setCurrentMatchId(matchId);
    };

    return (
        <ModalLayout ref={ref}>
            <div className="
                absolute flex flex-col
                max-w-4xl w-11/12
                p-5 md:p-8 gap-6
                rounded-tr-3xl rounded-bl-3xl
                beveled-bl-tr border beveled
                bg-slate-950 border-cyan-800 
                max-h-[90vh] overflow-hidden
            ">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl md:text-2xl text-slate-200 uppercase tracking-widest font-bold italic">
                            Join Lobby
                        </h1>
                        <p className="text-cyan-500 text-xs md:text-sm tracking-wider uppercase">
                            Select a match or search by ID
                        </p>
                    </div>
                    <button
                        onClick={() => ref && typeof ref !== 'function' && ref.current?.close()}
                        className="text-slate-500 hover:text-cyan-400 transition-colors"
                    >
                        <Icon icon="mdi:close" className="text-3xl" />
                    </button>
                </div>

                {/* Manual ID Input */}
                <div className="space-y-4">
                    <h2 className="
                        flex items-center
                        text-xs md:text-sm 
                        text-slate-200 uppercase tracking-widest
                    ">
                        <Icon
                            icon="mage:key-fill"
                            className="text-lg md:text-2xl mr-3 text-fuchsia-500"
                        />
                        Enter ID
                    </h2>
                    <div className="flex flex-wrap gap-3">
                        <input
                            type="text"
                            value={manualId}
                            onChange={(e) => setManualId(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleJoinById()}
                            placeholder="Enter ID"
                            className="
                                flex-1
                                px-4 py-3
                                bg-slate-900/50
                                border border-slate-700
                                rounded-tr-xl rounded-bl-xl
                                beveled-bl-tr
                                text-slate-200
                                placeholder:text-slate-600
                                focus:outline-none
                                focus:border-fuchsia-500
                                transition-colors
                            "
                        />
                        <button
                            onClick={handleJoinById}
                            disabled={!manualId.trim()}
                            className="
                                flex-1 md:flex-none
                                px-6 py-3
                                text-sm font-bold uppercase 
                                tracking-widest beveled-bl-tr
                                border rounded-tr-xl rounded-bl-xl
                                bg-fuchsia-950/70 border-fuchsia-400 text-fuchsia-400
                                transition-all
                                hover:bg-fuchsia-400 hover:text-slate-950
                                disabled:opacity-50 disabled:cursor-not-allowed
                            "
                        >
                            Join
                        </button>
                    </div>
                </div>

                {/* Matches List */}
                <div className="space-y-4 flex-1 overflow-hidden flex flex-col custom-scrollbar">
                    <h2 className="
                        flex items-center
                        text-xs md:text-sm 
                        text-slate-200 uppercase tracking-widest
                    ">
                        <Icon
                            icon="fluent:people-team-20-filled"
                            className="text-lg md:text-2xl mr-3 text-cyan-400"
                        />
                        Available Matches
                    </h2>

                    {isLoading ? (
                        <div className="flex justify-center items-center py-10">
                            <LoadingSpinner message="Loading matches..." />
                        </div>
                    ) : error ? (
                        <div className="flex justify-center items-center py-10">
                            <ErrorMessage
                                title="Error loading matches"
                                message={error.message}
                            />
                        </div>
                    ) : !matches || matches.length === 0 ? (
                        <div className="text-center py-10 text-slate-500">
                            <Icon icon="mdi:inbox" className="text-6xl mx-auto mb-4" />
                            <p className="text-sm uppercase tracking-wider">
                                No matches available
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-y-auto space-y-3 pr-2">
                            {matches.map((match) => (
                                <div
                                    key={match.id}
                                    onClick={() => handleJoinMatch(match.id)}
                                    className="
                                        p-4
                                        bg-slate-900/30
                                        border border-slate-700
                                        rounded-tr-xl rounded-bl-xl
                                        beveled-bl-tr
                                        hover:border-cyan-500
                                        hover:bg-slate-900/50
                                        cursor-pointer
                                        transition-all
                                    "
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-bold text-cyan-400 uppercase">
                                                    {match.game}
                                                </span>
                                                <span className="text-xs text-slate-500">
                                                    Best of {match.best_of}
                                                </span>
                                                -
                                                <span className="text-xs text-slate-500">
                                                    {match.bans_per_team} bans/team
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-400 font-mono">
                                                ID: {match.id}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {new Date(match.created_at).toLocaleDateString('es', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                        <Icon
                                            icon="mdi:arrow-right"
                                            className="text-2xl text-slate-500"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </ModalLayout>
    );
});