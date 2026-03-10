import { forwardRef, useState } from "react";
import { Icon } from "@iconify/react";
import { ModalLayout, ModalRef } from "@/layout/ModalLayout";
import { useMatchStore } from "@/stores/matchStore";
import { useTeamStore } from "@/stores/teamStore";
import { usePlayerStore } from "@/stores/playerStore";

export const StartMatchModal = forwardRef<ModalRef, object>((_props, ref) => {
    const { currentMatch, startMatch, updateLoading } = useMatchStore();
    const { teams } = useTeamStore();

    const [invert, setInvert] = useState(false);

    const [localBlue, setLocalBlue] = useState<string | null>(null);
    const [localRed, setLocalRed] = useState<string | null>(null);

    const { players } = usePlayerStore();

    // Only allow teams with exactly 5 active players
    const validTeams = teams.filter(t => {
        const activeCount = players.filter(p => p.team_id === t.id && p.is_active).length;
        return activeCount === 5;
    });

    const defaultBlue = validTeams[0]?.id;
    const blueId = localBlue ?? defaultBlue;

    const defaultRed = validTeams.find(t => t.id !== blueId)?.id ?? validTeams[1]?.id;
    const redId = localRed ?? defaultRed;

    const handleSwap = () => {
        setLocalBlue(redId);
        setLocalRed(blueId);
    };

    const handleStart = async () => {
        if (!currentMatch || !blueId || !redId) return;
        await startMatch(currentMatch.id, redId, blueId, invert);
        if (ref && typeof ref !== 'function' && ref.current) {
            ref.current.close();
        }
    };

    const canStart = !!blueId && !!redId && blueId !== redId && !updateLoading;

    return (
        <ModalLayout ref={ref}>
            <div className="
                absolute flex flex-col
                max-w-xl w-10/12
                p-5 md:p-8 gap-6
                rounded-tr-3xl rounded-bl-3xl
                beveled-bl-tr border beveled
                bg-slate-950 border-cyan-800
            ">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl md:text-2xl text-slate-200 uppercase tracking-widest font-bold italic">
                            Start Match
                        </h1>
                        <p className="text-cyan-500 text-xs md:text-sm tracking-wider uppercase">
                            Assign sides and launch
                        </p>
                    </div>
                    <button
                        onClick={() => ref && typeof ref !== 'function' && ref.current?.close()}
                        disabled={updateLoading}
                        className="text-slate-500 hover:text-cyan-400 transition-colors disabled:opacity-30"
                    >
                        <Icon icon="mdi:close" className="text-3xl" />
                    </button>
                </div>

                {/* Warning */}
                <div className="
                    flex items-start gap-3
                    px-4 py-3
                    bg-amber-950/30 border border-amber-600/50
                    rounded-tr-xl rounded-bl-xl beveled-bl-tr
                ">
                    <Icon icon="mdi:warning-outline" className="text-amber-400 text-2xl shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-300 tracking-wider leading-relaxed">
                        Once started, match parameters (Best of, Bans per team, Game) <span className="font-bold uppercase">cannot be modified</span>. Use Reset Match to make changes.
                    </p>
                </div>

                {/* Side assignment */}
                <div className="space-y-3">
                    <h2 className="
                        flex items-center
                        text-xs md:text-sm
                        text-slate-200 uppercase tracking-widest
                    ">
                        <Icon
                            icon="streamline-sharp:startup-solid"
                            className="text-lg md:text-2xl mr-3 text-cyan-400"
                        />
                        Side Assignment
                    </h2>

                    <div className="flex items-center gap-3">

                        {/* Blue side */}
                        <div className="flex-1 min-w-0 flex flex-col gap-1">
                            <span className="text-xs text-cyan-400 uppercase tracking-widest font-bold text-center">
                                Blue
                            </span>
                            <div className="
                                relative w-full flex items-center gap-2
                                px-3 py-4
                                bg-cyan-950/40 border border-cyan-400/60
                                rounded-tr-xl rounded-bl-xl beveled-bl-tr
                            ">
                                <Icon icon="mdi:shield" className="text-cyan-400 text-xl shrink-0 pointer-events-none" />
                                <select
                                    value={blueId || ""}
                                    onChange={(e) => {
                                        const newBlue = e.target.value;
                                        setLocalBlue(newBlue);
                                        if (newBlue === redId) setLocalRed(blueId);
                                    }}
                                    disabled={updateLoading}
                                    className="
                                        w-full bg-transparent text-sm text-cyan-200 font-semibold 
                                        truncate outline-none cursor-pointer appearance-none text-center
                                    "
                                >
                                    {validTeams.map(t => (
                                        <option key={`blue-${t.id}`} value={t.id} className="bg-slate-900 text-cyan-200">
                                            {t.name}
                                        </option>
                                    ))}
                                </select>
                                <Icon icon="mdi:chevron-down" className="text-cyan-400 text-xl shrink-0 pointer-events-none absolute right-3" />
                            </div>
                        </div>

                        {/* Swap button */}
                        <button
                            onClick={handleSwap}
                            disabled={updateLoading}
                            title="Swap sides"
                            className="
                                flex items-center justify-center
                                w-12 h-12 shrink-0
                                border border-slate-600 rounded-full
                                text-slate-400
                                hover:border-slate-400 hover:text-slate-200
                                transition-all disabled:opacity-30
                            "
                        >
                            <Icon
                                icon="tdesign:swap"
                                className="text-2xl"
                            />
                        </button>

                        {/* Red side */}
                        <div className="flex-1 min-w-0 flex flex-col gap-1">
                            <span className="text-xs text-fuchsia-400 uppercase tracking-widest font-bold text-center">
                                Red
                            </span>
                            <div className="
                                relative w-full flex items-center gap-2
                                px-3 py-4
                                bg-fuchsia-950/40 border border-fuchsia-400/60
                                rounded-tr-xl rounded-bl-xl beveled-bl-tr
                            ">
                                <Icon icon="mdi:shield" className="text-fuchsia-400 text-xl shrink-0 pointer-events-none" />
                                <select
                                    value={redId || ""}
                                    onChange={(e) => {
                                        const newRed = e.target.value;
                                        setLocalRed(newRed);
                                        if (newRed === blueId) setLocalBlue(redId);
                                    }}
                                    disabled={updateLoading}
                                    className="
                                        w-full bg-transparent text-sm text-fuchsia-200 font-semibold 
                                        truncate outline-none cursor-pointer appearance-none text-center
                                    "
                                >
                                    {validTeams.map(t => (
                                        <option key={`red-${t.id}`} value={t.id} className="bg-slate-900 text-fuchsia-200">
                                            {t.name}
                                        </option>
                                    ))}
                                </select>
                                <Icon icon="mdi:chevron-down" className="text-fuchsia-400 text-xl shrink-0 pointer-events-none absolute right-3" />
                            </div>
                        </div>

                    </div>
                </div>

                {/* Invert checkbox */}
                <label className="
                    flex items-center gap-4
                    p-4
                    bg-slate-900/40 border border-slate-700
                    rounded-tr-xl rounded-bl-xl beveled-bl-tr
                    cursor-pointer select-none
                    hover:border-slate-500 transition-colors
                ">
                    <div className="relative shrink-0">
                        <input
                            type="checkbox"
                            checked={invert}
                            onChange={(e) => setInvert(e.target.checked)}
                            className="sr-only"
                        />
                        <div className="
                            w-5 h-5 border-2 rounded
                            flex items-center justify-center
                            transition-colors
                        " style={{
                                borderColor: invert ? 'rgb(34 211 238)' : 'rgb(71 85 105)',
                                backgroundColor: invert ? 'rgb(8 145 178 / 0.2)' : 'transparent',
                            }}>
                            {invert && <Icon icon="mdi:check" className="text-cyan-400 text-sm" />}
                        </div>
                    </div>
                    <div>
                        <p className="text-sm text-slate-200 font-semibold uppercase tracking-wider">
                            Invert sides
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5 tracking-wider">
                            Teams swap blue/red on every even game (2, 4, 6…)
                        </p>
                    </div>
                </label>

                {/* Start button */}
                <button
                    onClick={handleStart}
                    disabled={!canStart}
                    className="
                        w-full py-3 md:py-4
                        text-lg font-bold uppercase tracking-widest
                        beveled-bl-tr border rounded-tr-2xl rounded-bl-2xl
                        bg-cyan-900/20 border-cyan-600 text-cyan-400
                        transition-all cursor-pointer
                        hover:bg-cyan-900/30 hover:border-cyan-400
                        disabled:opacity-40 disabled:cursor-not-allowed
                        flex items-center justify-center gap-2
                    "
                >
                    {updateLoading ? (
                        <>
                            <Icon icon="mdi:loading" className="animate-spin text-xl" />
                            Starting...
                        </>
                    ) : (
                        <>
                            <Icon icon="streamline-sharp:startup-solid" className="text-xl" />
                            Start Match
                        </>
                    )}
                </button>
            </div>
        </ModalLayout>
    );
});
