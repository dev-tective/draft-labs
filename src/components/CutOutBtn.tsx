import { Icon } from "@iconify/react";
import { twMerge } from "tailwind-merge";

interface Props {
    icon?: string;
    text?: string;
    alternative?: boolean;
    active?: boolean;
    disabled?: boolean;
    className?: string;
    onClick?: () => void;
}

export const CutOutBtn = ({ icon, text, disabled, onClick, className }: Props) => {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={twMerge(
                "flex justify-center items-center",
                "w-full gap-2",
                text ? "py-4 px-5" : "p-0",
                "text-xl md:text-2xl",
                "font-semibold text-nowrap",
                "border border-slate-700",
                "beveled-tr beveled-bl rounded-tr-2xl rounded-bl-2xl",
                "cursor-pointer transition-all",
                "hover:bg-cyan-950/70 hover:border-cyan-400",
                disabled ? "opacity-40 pointer-events-none" : "",
                className
            )}
        >
            {icon && (
                <Icon icon={icon} />
            )}
            {text && (
                <span className="text-sm md:text-base uppercase tracking-widest">
                    {text}
                </span>
            )}
        </button>
    );
}

export const CutOutBtnPrimary = ({ alternative, icon, text, active, disabled, onClick }: Props) => {
    const colorClasses = active
        ? 'text-slate-950 bg-cyan-400 pointer-events-none border-cyan-400'
        : alternative
            ? 'text-slate-200 border-fuchsia-500 bg-fuchsia-950/70 hover:bg-fuchsia-500 hover:text-slate-950'
            : 'text-slate-200 border-cyan-400 bg-cyan-950/70 hover:bg-cyan-400 hover:text-slate-950';

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`    
                flex justify-center items-center
                w-full min-w-48 gap-2 py-4 px-5
                font-semibold text-nowrap
                border beveled-tr beveled-bl rounded-tr-2xl rounded-bl-2xl
                cursor-pointer transition-all
                ${colorClasses}
                ${disabled ? 'opacity-40 pointer-events-none' : ''}
            `}
        >
            {icon && (
                <Icon
                    icon={icon}
                    className='text-xl md:text-2xl'
                />
            )}
            <span className="
                text-sm md:text-base
                uppercase tracking-widest
            ">
                {text}
            </span>
        </button>
    );
}