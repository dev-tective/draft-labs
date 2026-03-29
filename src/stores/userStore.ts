import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../supabaseClient';
import { AlertType, useAlertStore } from './alertStore';

export interface User {
    id: string;
    username: string;
}

interface UserState {
    user: User | null;
    createUser: (username: string) => Promise<void>;
    updateUser: (username: string) => Promise<void>;
}

export const useUserStore = create<UserState>()(
    persist(
        (set, get) => ({
            user: null,

            createUser: async (username: string) => {
                const addAlert = useAlertStore.getState().addAlert;

                const { data, error } = await supabase
                    .from('users')
                    .insert([{ username }])
                    .select('id, username')
                    .single();

                if (error) {
                    addAlert({
                        message: error.message || "No se pudo crear el usuario",
                        type: AlertType.ERROR,
                    });
                    throw error;
                }

                set({ user: data as User });
            },

            updateUser: async (username: string) => {
                const user = get().user;
                if (!user) return;

                const addAlert = useAlertStore.getState().addAlert;

                const { data, error } = await supabase
                    .from('users')
                    .update({ username })
                    .eq('id', user.id)
                    .select('id, username')
                    .single();

                if (error) {
                    addAlert({
                        message: error.message || "No se pudo actualizar el usuario",
                        type: AlertType.ERROR,
                    });
                    throw error;
                }

                set({ user: { ...get().user!, ...data } });
            },
        }),
        {
            name: 'user-storage',
        }
    )
);