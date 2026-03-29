interface Props {
    valueSelected: string | number | null;
    option: string;
    value: string | number;
    onClick?: () => void;
}

export const Option = ({ option, valueSelected, value, onClick }: Props) => {
    return (
        <button
            className={`
                relative
                w-full py-2 md:py-4
                border beveled-bl-tr
                rounded-tr-2xl rounded-bl-2xl
                cursor-pointer transition-all uppercase
                ${valueSelected === value
                    ? "bg-cyan-950/70 border-cyan-400 text-cyan-400"
                    : "border-slate-800 text-slate-400 hover:border-cyan-700"
                }
            `}
            onClick={onClick}
        >
            {valueSelected === value &&
                <div className="absolute bottom-0 right-0 w-2 h-2 bg-cyan-400" />
            }
            {option}
        </button>
    );
};