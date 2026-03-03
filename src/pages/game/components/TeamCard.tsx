
import { Team } from "@/stores/teamStore";
import { Icon } from "@iconify/react";
import React, { forwardRef } from "react";

export interface TeamCardProps extends React.HTMLAttributes<HTMLDivElement> {
    team?: Team | null;
    rightIcon?: React.ReactNode;
    isActive?: boolean;
    isDropTarget?: boolean;
    isPending?: boolean;
    isDragging?: boolean;
    isEmpty?: boolean;
}

export const TeamCard = forwardRef<HTMLDivElement, TeamCardProps>(({
    team,
    rightIcon,
    isActive = false,
    isDropTarget = false,
    isPending = false,
    isDragging = false,
    isEmpty = false,
    className = "",
    ...props
}, ref) => {

    const getContainerStyles = () => {
        if (isPending) return 'border-2 border-dashed border-cyan-400 bg-cyan-950/20';
        if (isDropTarget) return 'border-2 border-dashed border-cyan-400 bg-cyan-950/40 shadow-[0_0_24px_rgba(34,211,238,0.25)]';
        if (isActive) return 'border-2 border-solid border-cyan-500 bg-slate-900';
        if (isEmpty) return 'border-2 border-dashed border-slate-600 bg-slate-900/50';

        // Default draggable style
        return `
            border border-solid border-slate-700 bg-slate-900 
            hover:border-cyan-400 hover:bg-slate-800
        `;
    };

    return (
        <div
            ref={ref}
            className={`
                relative flex flex-col
                w-full max-w-96 gap-3 px-5 py-3
                beveled-tr beveled-bl rounded-tr-2xl rounded-bl-2xl
                transition-all duration-200 select-none
                ${getContainerStyles()}
                ${isDragging ? 'opacity-40 z-50 shadow-[0_0_20px_rgba(34,211,238,0.3)]' : ''}
                ${className}
            `}
            {...props}
        >
            {isPending ? (
                <div className="flex items-center justify-between w-full h-[64px] animate-pulse">
                    <div className="w-16 h-16 rounded-full bg-slate-700 shrink-0" />
                    <div className="flex flex-col gap-2 items-center flex-1">
                        <div className="h-4 w-20 rounded bg-slate-700" />
                        <div className="h-3 w-16 rounded bg-slate-700" />
                    </div>
                    <div className="w-8 h-8 rounded bg-slate-700 shrink-0" />
                </div>
            ) : isEmpty || !team ? (
                <>
                    <div className="w-16 h-16 rounded-full flex items-center justify-center bg-slate-800/50 border border-slate-700 shrink-0">
                        <Icon icon="ph:trophy-duotone" className="text-3xl text-slate-600" />
                    </div>
                    <div className="flex flex-col gap-1 items-center flex-1">
                        <span className="text-slate-500 text-sm text-center px-2 font-bold uppercase tracking-wide leading-tight">
                            Drop winner here
                        </span>
                    </div>
                    <div className="w-8 shrink-0" /> {/* Spacer */}
                </>
            ) : (
                <div className="flex items-center justify-between w-full gap-3">
                    <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center bg-slate-800 border border-slate-600 shrink-0">
                        {team.logo_url ? (
                            <img src={team.logo_url} alt={team.acronym} className="w-full h-full object-cover" />
                        ) : (
                            <Icon icon="game-icons:shield" className="text-3xl text-slate-500" />
                        )}
                    </div>

                    <div className="flex flex-col gap-1 justify-center items-center flex-1 overflow-hidden">
                        {/* Acronym */}
                        <span className="text-cyan-400 font-black text-base uppercase tracking-widest truncate w-full ">
                            {team.acronym}
                        </span>

                        {/* Name */}
                        <span className="text-slate-400 text-sm truncate w-full uppercase tracking-wide">
                            {team.name}
                        </span>
                    </div>


                    {/* Right Icon */}
                    {rightIcon && <div className="shrink-0">{rightIcon}</div>}
                </div>
            )}
        </div>
    );
});
