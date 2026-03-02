import { Icon } from "@iconify/react";

interface Props {
    icon?: string;
    text: string;
    alternative?: boolean;
    active?: boolean;
    onClick?: () => void;
}

export const CutOutBtn = ({ icon, text, onClick }: Props) => {
    return (
        <button
            onClick={onClick}
            className={`
                flex justify-center items-center
                w-full gap-2 py-4 px-5
                font-semibold text-nowrap
                border border-slate-700
                beveled-tr beveled-bl rounded-tr-2xl rounded-bl-2xl
                cursor-pointer transition-all
                hover:bg-cyan-950/70 hover:border-cyan-400
            `}
        >
            {icon && (
                <Icon
                    icon={icon}
                    className='text-xl md:text-2xl'
                />
            )}
            <span className="
                text-sm md:text-base text-slate-200
                uppercase tracking-widest
            ">
                {text}
            </span>
        </button>
    );
}

export const CutOutBtnPrimary = ({ alternative, icon, text, active, onClick }: Props) => {
    const colorClasses = active
        ? 'text-slate-950 bg-cyan-400 pointer-events-none border-cyan-400'
        : alternative
            ? 'text-slate-200 border-fuchsia-500 bg-fuchsia-950/70 hover:bg-fuchsia-500 hover:text-slate-950'
            : 'text-slate-200 border-cyan-400 bg-cyan-950/70 hover:bg-cyan-400 hover:text-slate-950';

    return (
        <button
            onClick={onClick}
            className={`    
                flex justify-center items-center
                w-full min-w-48 gap-2 py-4 px-5
                font-semibold text-nowrap
                border beveled-tr beveled-bl rounded-tr-2xl rounded-bl-2xl
                cursor-pointer transition-all
                ${colorClasses}
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