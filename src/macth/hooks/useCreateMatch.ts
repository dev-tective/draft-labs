import { supabase } from "@/supabaseClient";
import { AlertType, useAlertStore } from "@/stores/alertStore";
import { Match } from "@/macth/match.types";
import { useState } from "react";

const alert = (message: string, type: AlertType) =>
    useAlertStore.getState().addAlert({ message, type });

export const useCreateMatch = () => {
    const [loading, setLoading] = useState(false);

    const createMatch = async (params: Partial<Match> & { invert?: boolean }) => {
        setLoading(true);

        try {
            const { data, error } = await supabase.rpc('start_match', {
                p_room_id: params.room_id,
                p_best_of: params.best_of ?? 1,
                p_team_red_id: params.team_a_id,
                p_team_blue_id: params.team_b_id,
                p_invert: params.invert ?? false,
                p_activate: params.is_live ?? false,
            });

            if (error) throw error;

            alert('Encuentro creado correctamente', AlertType.SUCCESS);
            return data;
        } catch (error: any) {
            alert(error.message, AlertType.ERROR);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        createMatch,
    };
};
