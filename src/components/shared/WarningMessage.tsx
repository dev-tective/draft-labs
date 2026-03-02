import { Panel } from "./Panel";

interface WarningMessageProps {
    message?: string;
    title?: string;
    onAction?: () => void;
    actionLabel?: string;
}

export const WarningMessage = ({
    message = "Warning",
    title = "Attention",
    onAction,
    actionLabel = "Understood"
}: WarningMessageProps) => {
    return (
        <Panel>
            {/* Warning Icon */}
            <div className="relative">
                <div className="w-20 h-20 rounded-full bg-yellow-500/20 border-2 border-yellow-500 flex items-center justify-center">
                    <svg
                        className="w-10 h-10 text-yellow-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                    </svg>
                </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-yellow-400">
                {title}
            </h2>

            {/* Message */}
            <p className="text-slate-300 text-base leading-relaxed tracking-wider">
                {message}
            </p>

            {/* Action Button */}
            {onAction && (
                <button
                    onClick={onAction}
                    className="mt-4 px-6 py-3 bg-yellow-600 hover:bg-yellow-500 text-white font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
                >
                    <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                        />
                    </svg>
                    {actionLabel}
                </button>
            )}
        </Panel>
    )
};
