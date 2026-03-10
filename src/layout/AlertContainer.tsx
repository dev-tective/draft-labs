import { Icon } from "@iconify/react";
import { useState, useEffect, useRef } from "react";
import { useAlertStore, AlertType, Alert as AlertData } from "@/stores/alertStore";

export interface AlertProps {
    alert: AlertData;
}

export const Alert = ({ alert }: AlertProps) => {
    const removeAlert = useAlertStore((state) => state.removeAlert);
    const { id, message, type = AlertType.INFO, handleAction, duration = 5000 } = alert;

    const [isClosing, setIsClosing] = useState(false);
    const [isPaused, setIsPaused] = useState(false);

    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const startTimeRef = useRef<number>(Date.now());
    const remainingRef = useRef<number>(duration);

    useEffect(() => {
        // Start the initial close timer
        startTimeRef.current = Date.now();
        timerRef.current = setTimeout(() => {
            setIsClosing(true);
        }, remainingRef.current);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    const handleMouseEnter = () => {
        if (isClosing) return;
        // Save how much time is left
        remainingRef.current -= Date.now() - startTimeRef.current;
        if (timerRef.current) clearTimeout(timerRef.current);
        setIsPaused(true);
    };

    const handleMouseLeave = () => {
        if (isClosing) return;
        // Restart timer with remaining time
        startTimeRef.current = Date.now();
        timerRef.current = setTimeout(() => {
            setIsClosing(true);
        }, remainingRef.current);
        setIsPaused(false);
    };

    // Remove alert from store after close animation completes
    useEffect(() => {
        if (isClosing) {
            const removeTimer = setTimeout(() => {
                removeAlert(id);
            }, 300); // Match slide-close animation duration

            return () => clearTimeout(removeTimer);
        }
    }, [isClosing, id, removeAlert]);

    const handleClose = () => {
        setIsClosing(true);
    };

    return (
        <span
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={`
                pointer-events-auto relative overflow-hidden
                flex justify-between items-center
                w-full p-5 gap-3
                border-2
                ${isClosing ? 'slide-close' : 'slide-open'}
                rounded-tl-xl rounded-br-xl beveled-br-tl text-wrap
                transition-all
                ${type === AlertType.INFO && 'border-cyan-700 bg-cyan-950/90'}
                ${type === AlertType.WARNING && 'border-yellow-700 bg-yellow-950/90'}
                ${type === AlertType.ERROR && 'border-red-700 bg-red-950/90'}
                ${type === AlertType.SUCCESS && 'border-green-700 bg-green-950/90'}
            `}>
            {/* Countdown progress bar */}
            <div
                className={`
                    absolute bottom-0 left-0 h-1 w-full
                    ${type === AlertType.INFO && 'bg-cyan-500'}
                    ${type === AlertType.WARNING && 'bg-yellow-500'}
                    ${type === AlertType.ERROR && 'bg-red-500'}
                    ${type === AlertType.SUCCESS && 'bg-green-500'}
                `}
                style={{
                    animation: `countdown ${duration}ms linear forwards`,
                    animationPlayState: isPaused ? 'paused' : 'running'
                }}
            />

            <Icon
                icon={`mdi:${type === AlertType.INFO ?
                    'information-outline' : type === AlertType.WARNING ?
                        'warning-outline' : type === AlertType.ERROR ?
                            'error-outline' : 'check-circle-outline'}`}
                width="24"
                height="24"
            />

            <p className="flex-1 text-slate-300 text-sm tracking-wider">
                {message}
            </p>
            <div className="text-slate-400 text-xl space-x-2">
                {handleAction && (
                    <button
                        onClick={() => {
                            handleAction();
                            handleClose();
                        }}
                        className="hover:text-slate-200"
                    >
                        <Icon icon="mdi:check-bold" />
                    </button>
                )}
                <button
                    onClick={handleClose}
                    className="hover:text-slate-200"
                >
                    <Icon icon="mdi:close-bold" />
                </button>
            </div>
        </span>
    )
}

export const AlertContainer = () => {
    const alerts = useAlertStore((state) => state.alerts);

    return (
        <aside className="
            fixed flex flex-col items-end justify-end 
            h-dvh w-2/10 min-w-80 gap-3
            left-5 bottom-5 z-50
            pointer-events-none
        ">
            {alerts.map((alert) => (
                <Alert key={alert.id} alert={alert} />
            ))}
        </aside>
    );
}