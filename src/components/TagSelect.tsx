import { Icon } from "@iconify/react";
import { useState, useEffect } from "react";

interface Props {
    field: string;
    icon: string;
    options: { value: number | string; label: string }[];
    initialValue: number | string | null;
    nullable?: boolean;
    onUpdate: (value: number | string | null) => void;
    disabled?: boolean;
}

export const TagSelect = ({ field, icon, options, initialValue, nullable, onUpdate, disabled }: Props) => {
    const [value, setValue] = useState<number | string | null>(initialValue);

    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    return (
        <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-400 uppercase">{field}:</span>

            <div className="relative">
                <Icon
                    icon={icon}
                    className="
                        absolute left-3 top-1/2
                        -translate-y-1/2
                        text-fuchsia-500 text-lg
                        pointer-events-none
                    "
                />
                <select
                    value={value ?? ""}
                    onChange={(e) => {
                        const val = e.target.value;
                        const newValue = val === "" ? null : val;
                        setValue(newValue);
                        onUpdate(newValue);
                    }}
                    disabled={disabled}
                    className="
                        min-w-48 px-9 py-3
                        bg-slate-900 border border-slate-700
                        text-slate-200 text-sm uppercase tracking-wide
                        beveled-tr beveled-bl rounded-tr-2xl rounded-bl-2xl
                        cursor-pointer outline-none
                        hover:border-fuchsia-500 focus:border-fuchsia-400
                        transition-colors appearance-none
                        disabled:opacity-50 disabled:cursor-not-allowed
                    "
                >
                    {nullable && (
                        <option value="">— Select {field} —</option>
                    )}
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <Icon
                    icon="mdi:chevron-down"
                    className=" 
                        absolute right-3 top-1/2
                        -translate-y-1/2
                        text-slate-400 text-lg
                        pointer-events-none
                    "
                />
            </div>
        </div>
    );
};
