import { forwardRef, useState } from "react";
import { Icon } from "@iconify/react";
import { ModalLayout, ModalRef } from "@/layout/ModalLayout";
import { useMatchStore } from "@/stores/matchStore";
import { useTeamStore } from "@/stores/teamStore";

export const ResetMatchModal = forwardRef<ModalRef, object>((_props, ref) => {
    const { currentMatch, resetMatch, updateLoading } = useMatchStore();
    const { teams } = useTeamStore();

    // IDs de teams marcados para eliminar
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const toggleTeam = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const handleReset = async () => {
        if (!currentMatch) return;
        await resetMatch(currentMatch.id, Array.from(selectedIds));
        setSelectedIds(new Set());
        if (ref && typeof ref !== 'function' && ref.current) {
            ref.current.close();
        }
    };

    return (
        <ModalLayout ref={ref}>
            <div className="
                absolute flex flex-col
                max-w-xl w-10/12
                p-5 md:p-8 gap-6
                rounded-tr-3xl rounded-bl-3xl
                beveled-bl-tr border beveled
                bg-slate-950 border-fuchsia-800
            ">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl md:text-2xl text-slate-200 uppercase tracking-widest font-bold italic">
                            Reset Match
                        </h1>
                        <p className="text-fuchsia-500 text-xs md:text-sm tracking-wider uppercase">
                            All games will be removed
                        </p>
                    </div>
                    <button
                        onClick={() => ref && typeof ref !== 'function' && ref.current?.close()}
                        disabled={updateLoading}
                        className="text-slate-500 hover:text-fuchsia-400 transition-colors disabled:opacity-30"
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
                        All games and picks will be <span className="font-bold uppercase">permanently deleted</span>. Checked teams and their players will also be removed. This action cannot be undone.
                    </p>
                </div>

                {/* Teams list */}
                <div className="space-y-3">
                    <h2 className="
                        flex items-center
                        text-xs md:text-sm
                        text-slate-200 uppercase tracking-widest
                    ">
                        <Icon
                            icon="fluent:people-team-20-filled"
                            className="text-lg md:text-2xl mr-3 text-fuchsia-400"
                        />
                        Teams to delete
                        <span className="ml-2 text-slate-400 normal-case tracking-wider text-sm">
                            (Leave unchecked to keep)
                        </span>
                    </h2>

                    {teams.length === 0 ? (
                        <p className="text-sm text-slate-500 italic px-1">No teams in this match.</p>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {teams.map((team) => {
                                const checked = selectedIds.has(team.id);
                                return (
                                    <label
                                        key={team.id}
                                        className={`
                                            flex items-center gap-4
                                            px-4 py-3
                                            border rounded-tr-xl rounded-bl-xl beveled-bl-tr
                                            cursor-pointer select-none transition-all
                                            ${checked
                                                ? 'bg-fuchsia-950/40 border-fuchsia-500/70'
                                                : 'bg-slate-900/30 border-slate-700 hover:border-slate-500'}
                                        `}
                                    >
                                        {/* Custom checkbox */}
                                        <div className="relative shrink-0">
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => toggleTeam(team.id)}
                                                className="sr-only"
                                            />
                                            <div className="
                                                w-5 h-5 border-2 rounded
                                                flex items-center justify-center
                                                transition-colors
                                            " style={{
                                                    borderColor: checked ? 'rgb(232 121 249)' : 'rgb(71 85 105)',
                                                    backgroundColor: checked ? 'rgb(112 26 117 / 0.3)' : 'transparent',
                                                }}>
                                                {checked && (
                                                    <Icon icon="mdi:check" className="text-fuchsia-400 text-sm" />
                                                )}
                                            </div>
                                        </div>

                                        {/* Team info */}
                                        <div className="flex items-center gap-3 min-w-0">
                                            {team.logo_url ? (
                                                <img
                                                    src={team.logo_url}
                                                    alt={team.acronym}
                                                    className="w-8 h-8 rounded object-cover shrink-0"
                                                />
                                            ) : (
                                                <div className="
                                                    w-8 h-8 rounded shrink-0
                                                    bg-slate-800 border border-slate-700
                                                    flex items-center justify-center
                                                    text-xs font-bold text-slate-400
                                                ">
                                                    {team.acronym.slice(0, 2).toUpperCase()}
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-slate-200 truncate">
                                                    {team.name}
                                                </p>
                                                <p className="text-xs text-slate-500 uppercase tracking-wider">
                                                    {team.acronym}
                                                </p>
                                            </div>
                                        </div>

                                        {checked && (
                                            <span className="ml-auto text-xs text-fuchsia-400 font-semibold uppercase tracking-wider shrink-0">
                                                Will delete
                                            </span>
                                        )}
                                    </label>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Reset button */}
                <button
                    onClick={handleReset}
                    disabled={updateLoading}
                    className="
                        w-full py-3 md:py-4
                        text-lg font-bold uppercase tracking-widest
                        beveled-bl-tr border rounded-tr-2xl rounded-bl-2xl
                        bg-fuchsia-900/20 border-fuchsia-600 text-fuchsia-400
                        transition-all cursor-pointer
                        hover:bg-fuchsia-900/30 hover:border-fuchsia-400
                        disabled:opacity-40 disabled:cursor-not-allowed
                        flex items-center justify-center gap-2
                    "
                >
                    {updateLoading ? (
                        <>
                            <Icon icon="mdi:loading" className="animate-spin text-xl" />
                            Resetting...
                        </>
                    ) : (
                        <>
                            <Icon icon="ix:hard-reset" className="text-xl" />
                            {selectedIds.size > 0
                                ? `Reset & Delete ${selectedIds.size} team${selectedIds.size > 1 ? 's' : ''}`
                                : 'Reset Match'}
                        </>
                    )}
                </button>
            </div>
        </ModalLayout>
    );
});
