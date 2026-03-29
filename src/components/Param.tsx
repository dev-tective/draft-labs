interface Props {
    param: string | number | boolean;
    label: string;
}

export const Param = ({ param, label }: Props) => {
    const displayParam = typeof param === 'boolean' ? (param ? 'SÍ' : 'NO') : param;

    return (
        <div className="flex items-center gap-2">
            <span className="uppercase text-xs font-medium text-slate-400">
                {label}:
            </span>
            <div className="
                min-w-8 h-7 px-3
                flex items-center justify-center
                bg-fuchsia-950/70 border border-fuchsia-500
                text-white text-[11px] font-bold uppercase
                pointer-events-none select-none
            ">
                {displayParam}
            </div>
        </div>
    );
};