import { supabase } from "@/supabaseClient";
import { AlertType, useAlertStore } from "@/stores/alertStore";
import { useState } from "react";

const alert = (message: string, type: AlertType) =>
    useAlertStore.getState().addAlert({ message, type });

export const useUpdateMatch = () => {
    const [loading, setLoading] = useState(false);

    const updateMatchStatus = async (matchId: number, status: { is_live?: boolean; finished?: boolean }) => {
        setLoading(true);

        try {
            const { error } = await supabase
                .from('matches')
                .update(status)
                .eq('id', matchId);

            if (error) throw error;

            alert('Estado del encuentro actualizado', AlertType.SUCCESS);
        } catch (error: any) {
            alert(error.message, AlertType.ERROR);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        updateMatchStatus,
    };
};
