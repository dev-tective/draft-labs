import { Panel } from "./Panel";

interface ErrorMessageProps {
    message?: string;
    title?: string;
    onRetry?: () => void;
}

export const ErrorMessage = ({
    message = "An error has occurred",
    title = "Error",
    onRetry
}: ErrorMessageProps) => {
    return (
        <Panel>
            {/* Error Icon */}
            <div className="relative">
                <div className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center">
                    <svg
                        className="w-10 h-10 text-red-500"
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
            <h2 className="text-2xl font-bold text-red-400">{title}</h2>
            {/* Message */}
            <p className="text-slate-300 text-base leading-relaxed">{message}</p>
            {/* Retry Button */}
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="mt-4 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
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
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                    </svg>
                    Reintentar
                </button>
            )}
        </Panel>
    )
};
