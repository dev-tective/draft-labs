import { create } from 'zustand';

export enum AlertType {
    INFO,
    WARNING,
    ERROR,
    SUCCESS
}

export interface Alert {
    id: string;
    message: string;
    type: AlertType;
    handleAction?: () => void | Promise<void>;
    duration?: number;
}

interface AlertStore {
    alerts: Alert[];
    addAlert: (alert: Omit<Alert, 'id'>) => void;
    removeAlert: (id: string) => void;
    clearAlerts: () => void;
}

const generateId = () => `alert-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

export const useAlertStore = create<AlertStore>((set, get) => ({
    alerts: [],

    addAlert: (alert) => set((state) => {
        if (get().alerts.length >= 10) return state;
        return { alerts: [...state.alerts, { ...alert, id: generateId() }] }
    }),

    removeAlert: (id) => set((state) => ({
        alerts: state.alerts.filter((alert) => alert.id !== id)
    })),

    clearAlerts: () => set({ alerts: [] })
}));
