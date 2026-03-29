interface Props {
    label: string;
    fieldId: string;
    value: number;
    onChange: (value: number) => void;
    disabled?: boolean;
    values?: number[]; // Custom set of values to cycle through
}

export const MatchEditorField = ({
    label,
    fieldId,
    value,
    onChange,
    disabled = false,
    values,
}: Props) => {
    const handleIncrement = () => {
        if (!values) return;

        const currentIndex = values.indexOf(value);
        if (currentIndex < values.length - 1) {
            onChange(values[currentIndex + 1]);
        }
    };

    const handleDecrement = () => {
        if (!values) return;

        const currentIndex = values.indexOf(value);
        if (currentIndex > 0) {
            onChange(values[currentIndex - 1]);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <label
                htmlFor={fieldId}
                className="uppercase text-sm font-medium text-slate-400"
            >
                {label}:
            </label>
            <div className="flex items-center gap-1">
                {/* Decrement Button */}
                <button
                    type="button"
                    onClick={handleDecrement}
                    disabled={disabled || !values || values.indexOf(value) <= 0}
                    className={`
                        w-6 h-8 flex items-center justify-center
                        bg-slate-950
                        hover:bg-fuchsia-950/70 hover:border-fuchsia-500
                        border border-slate-700 rounded-l-lg
                        text-white font-bold text-lg
                        focus:outline-none focus:ring-2 focus:ring-fuchsia-500
                        disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-fuchsia-700/70
                        transition-all
                    `}
                >
                    -
                </button>

                {/* Input */}
                <input
                    id={fieldId}
                    type="text"
                    value={value}
                    readOnly
                    disabled={disabled}
                    className={`
                        w-12 h-8 px-2
                        bg-slate-800/20 border-y border-slate-700
                        text-white text-center font-semibold
                        pointer-events-none select-none
                        focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:z-10
                        disabled:opacity-50 disabled:cursor-not-allowed
                        transition-all
                    `}
                />

                {/* Increment Button */}
                <button
                    type="button"
                    onClick={handleIncrement}
                    disabled={disabled || !values || values.indexOf(value) >= values.length - 1}
                    className={`
                        w-6 h-8 flex items-center justify-center
                        bg-slate-950
                        hover:bg-fuchsia-950/70 hover:border-fuchsia-500
                        border border-slate-700 rounded-r-lg
                        text-white font-bold text-lg
                        focus:outline-none focus:ring-2 focus:ring-fuchsia-500
                        disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-fuchsia-700/70
                        transition-all
                    `}
                >
                    +
                </button>
            </div>
        </div>
    );
}