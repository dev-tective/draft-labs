import { forwardRef, useState } from "react";
import { Icon } from "@iconify/react";
import { ModalLayout, ModalRef } from "@/layout/ModalLayout";
import { useTeamStore } from "@/stores/teamStore";
import { useRoomStore } from "@/room/store/roomStore";
import { useCreateMatch } from "@/macth/hooks/useCreateMatch";
import { ModalSection } from "@/components/shared/ModalSection";
import { useNavigate } from "react-router-dom";

export const StartMatchModal = forwardRef<ModalRef, object>((_props, ref) => {
    const { teams } = useTeamStore();
    const { activeRoom } = useRoomStore();
    const { createMatch, loading } = useCreateMatch();
    const navigate = useNavigate();

    const [invert, setInvert] = useState(false);
    const [activate, setActivate] = useState(false);
    const [bestOf, setBestOf] = useState<number>(3);
    const bestOfValues = [1, 3, 5, 7];
    const bestOfIndex = bestOfValues.indexOf(bestOf);

    const [localBlue, setLocalBlue] = useState<number | null>(null);
    const [localRed, setLocalRed] = useState<number | null>(null);

    // Only allow teams with exactly 5 active players
    const validTeams = teams.filter(t => {
        const activeCount = t.players.filter(p => p.is_active).length;
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

    const handleClose = () => {
        if (loading) return;
        if (ref && typeof ref !== 'function' && ref.current) {
            ref.current.close();
        }
    };

    const handleStart = async () => {
        if (!activeRoom || !blueId || !redId) return;

        const matchId = await createMatch({
            room_id: activeRoom.id,
            team_a_id: redId,   // Red is the team that picks first (usually Team A internally DB-wise or Red)
            team_b_id: blueId,  // Blue
            best_of: bestOf,
            is_live: activate,
            invert: invert,
        });

        if (matchId && activate) {
            handleClose();
            navigate(`/matches/${matchId}`);
        } else if (matchId) {
            // Close if created but not activated right away
            handleClose();
        }
    };

    const canStart = !!blueId && !!redId && blueId !== redId && !loading && !!activeRoom;

    return (
        <ModalLayout ref={ref} canClose={!loading}>
            <div className="
                absolute flex flex-col
                max-w-2xl w-10/12
                p-5 md:p-8 gap-6
                rounded-tr-3xl rounded-bl-3xl
                beveled-bl-tr border beveled
                bg-slate-950 border-cyan-800
            ">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl md:text-2xl text-slate-200 uppercase tracking-widest font-bold italic">
                            Crear Match
                        </h1>
                        <p className="text-cyan-500 text-xs md:text-sm tracking-wider uppercase">
                            Configura el encuentro
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={loading}
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
                        Una vez creado, los parámetros (Mejor de, Participantes) <span className="font-bold uppercase">no pueden ser modificados</span>.
                    </p>
                </div>

                {/* Best Of Slider */}
                <ModalSection
                    icon="mdi:format-list-numbered"
                    iconColor="text-amber-500"
                    title="Formato (Mejor de)"
                >
                    <div className="flex flex-row-reverse items-center gap-6">
                        <div className="text-center">
                            <span className="text-2xl md:text-5xl font-bold text-amber-500 tracking-wider">
                                {bestOf}
                            </span>
                            <p className="text-slate-500 text-xs uppercase tracking-widest mt-2">
                                Games
                            </p>
                        </div>

                        <div className="px-2 w-full">
                            <input
                                type="range"
                                min="0"
                                step="1"
                                max={(bestOfValues.length - 1).toString()}
                                value={bestOfIndex}
                                onChange={(e) => setBestOf(bestOfValues[Number(e.target.value)])}
                                className="
                                    w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer
                                    [&::-webkit-slider-thumb]:appearance-none
                                    [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6
                                    [&::-webkit-slider-thumb]:bg-amber-500 [&::-webkit-slider-thumb]:rounded-full
                                    [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg
                                    [&::-webkit-slider-thumb]:shadow-amber-500/50 [&::-webkit-slider-thumb]:hover:bg-amber-400
                                    [&::-webkit-slider-thumb]:transition-all
                                    [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6
                                    [&::-moz-range-thumb]:bg-amber-500 [&::-moz-range-thumb]:border-0
                                    [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer
                                    [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:shadow-amber-500/50
                                    [&::-moz-range-thumb]:hover:bg-amber-400 [&::-moz-range-thumb]:transition-all
                                "
                            />
                            <div className="flex justify-between mt-2 px-1">
                                {bestOfValues.map((val) => (
                                    <span
                                        key={val}
                                        className={`
                                            text-xs font-medium transition-all
                                            ${bestOf === val
                                                ? 'text-amber-500 text-base font-bold'
                                                : 'text-slate-500'
                                            }
                                        `}
                                    >
                                        BO{val}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </ModalSection>

                {/* Side assignment */}
                <ModalSection
                    icon="mdi:shield-half-full"
                    iconColor="text-cyan-400"
                    title="Lados Iniciales"
                >
                    <div className="flex flex-col md:flex-row items-center gap-3">
                        {/* Blue side */}
                        <div className="flex-1 w-full min-w-0 flex flex-col gap-1">
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
                                        const newBlue = Number(e.target.value);
                                        setLocalBlue(newBlue);
                                        if (newBlue === redId) setLocalRed(blueId);
                                    }}
                                    disabled={loading}
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
                            disabled={loading}
                            title="Intercambiar lados"
                            className="
                                flex items-center justify-center
                                w-12 h-12 shrink-0
                                border border-slate-600 rounded-full
                                text-slate-400
                                hover:border-cyan-400 hover:text-cyan-200
                                hover:bg-cyan-950/30
                                transition-all disabled:opacity-30
                                my-2 md:my-0 md:mt-5
                            "
                        >
                            <Icon
                                icon="tdesign:swap"
                                className="text-2xl rotate-90 md:rotate-0"
                            />
                        </button>

                        {/* Red side */}
                        <div className="flex-1 w-full min-w-0 flex flex-col gap-1">
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
                                        const newRed = Number(e.target.value);
                                        setLocalRed(newRed);
                                        if (newRed === blueId) setLocalBlue(redId);
                                    }}
                                    disabled={loading}
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
                </ModalSection>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Invert Toggle */}
                    <button
                        onClick={() => setInvert((prev) => !prev)}
                        className={`
                            flex items-center gap-3 w-full
                            px-4 py-3
                            border rounded-tr-xl rounded-bl-xl beveled-bl-tr
                            transition-all
                            ${invert
                                ? 'bg-cyan-950/70 border-cyan-400 text-cyan-400'
                                : 'bg-slate-900/30 border-slate-700 text-slate-500'
                            }
                        `}
                    >
                        <div className="flex items-center gap-3 w-full">
                            <Icon
                                icon={invert ? "mdi:toggle-switch" : "mdi:toggle-switch-off"}
                                className="text-3xl shrink-0"
                            />
                            <div className="text-left">
                                <span className="block text-xs uppercase tracking-widest font-bold">
                                    Alternar lados
                                </span>
                                <span className="text-[10px] uppercase text-slate-400">
                                    Cambio de lado entre partidas
                                </span>
                            </div>
                        </div>
                    </button>

                    {/* Auto-start Toggle */}
                    <button
                        onClick={() => setActivate((prev) => !prev)}
                        className={`
                            flex items-center gap-3 w-full
                            px-4 py-3
                            border rounded-tr-xl rounded-bl-xl beveled-bl-tr
                            transition-all
                            ${activate
                                ? 'bg-emerald-950/70 border-emerald-400 text-emerald-400'
                                : 'bg-slate-900/30 border-slate-700 text-slate-500'
                            }
                        `}
                    >
                        <div className="flex items-center gap-3 w-full">
                            <Icon
                                icon={activate ? "mdi:toggle-switch" : "mdi:toggle-switch-off"}
                                className="text-3xl shrink-0"
                            />
                            <div className="text-left">
                                <span className="block text-xs uppercase tracking-widest font-bold">
                                    Iniciar Inmediatamente
                                </span>
                                <span className="text-[10px] uppercase text-slate-400">
                                    El Match pasará a Live
                                </span>
                            </div>
                        </div>
                    </button>
                </div>


                {/* Start button */}
                <button
                    onClick={handleStart}
                    disabled={!canStart}
                    className="
                        w-full py-3 md:py-4
                        text-lg font-bold uppercase tracking-widest
                        beveled-bl-tr border rounded-tr-2xl rounded-bl-2xl
                        bg-cyan-900/40 border-cyan-500 text-cyan-400
                        transition-all cursor-pointer
                        hover:bg-cyan-500 hover:text-slate-950
                        disabled:opacity-40 disabled:cursor-not-allowed
                        flex items-center justify-center gap-2
                    "
                >
                    {loading ? (
                        <>
                            <Icon icon="mdi:loading" className="animate-spin text-xl" />
                            Creando...
                        </>
                    ) : (
                        <>
                            <Icon icon="material-symbols:swords" className="text-xl" />
                            Crear Match
                        </>
                    )}
                </button>
            </div>
        </ModalLayout>
    );
});
