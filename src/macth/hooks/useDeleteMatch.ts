import { supabase } from "@/supabaseClient";
import { AlertType, useAlertStore } from "@/stores/alertStore";
import { useState } from "react";

const alert = (message: string, type: AlertType) =>
    useAlertStore.getState().addAlert({ message, type });

export const useDeleteMatch = () => {
    const [loading, setLoading] = useState(false);

    const deleteMatch = (matchId: number) => {
        useAlertStore.getState().addAlert({
            message: '¿Estás seguro de que quieres eliminar este encuentro?',
            type: AlertType.WARNING,
            handleAction: async () => {
                setLoading(true);
                try {
                    const { error } = await supabase
                        .from('matches')
                        .delete()
                        .eq('id', matchId);

                    if (error) throw error;

                    alert('El encuentro fue eliminado correctamente', AlertType.SUCCESS);
                } catch (error: any) {
                    alert(error.message, AlertType.ERROR);
                } finally {
                    setLoading(false);
                }
            },
        });
    };

    return {
        loading,
        deleteMatch,
    };
};
