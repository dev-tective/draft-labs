import { Panel } from "./Panel";

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    message?: string;
}

const sizeClasses = {
    sm: 'w-8 h-8 border-2',
    md: 'w-12 h-12 border-3',
    lg: 'w-16 h-16 border-4',
    xl: 'w-24 h-24 border-4'
};

export const LoadingSpinner = ({ size = 'lg', message }: LoadingSpinnerProps) => {
    return (
        <Panel>
            <div className={`loader ${sizeClasses[size]}`}></div>
            {/* <div className={`${sizeClasses[size]} border-cyan-500/30 border-t-cyan-400 rounded-[] animate-spin`}></div> */}
            {message && (
                <div className="text-lg text-slate-300 font-medium">
                    {message}
                </div>
            )}
        </Panel>
    )
};
