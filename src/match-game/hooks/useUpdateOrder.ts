import { useState } from "react";
import { supabase } from "@/supabaseClient";
import { Pick, Ban } from "../match-game.types";
import { AlertType, useAlertStore } from "@/stores/alertStore";

export const useUpdateOrder = () => {
    const [loading, setLoading] = useState(false);

    const updatePickOrder = async (picksToUpdate: Pick[]) => {
        setLoading(true);
        try {
            // Se asume un número pequeño de picks, así que Promise.all con updates individuales es viable
            const promises = picksToUpdate.map(pick => 
                supabase.from('picks').update({ pick_order: pick.pick_order }).eq('id', pick.id)
            );

            const results = await Promise.all(promises);
            const errors = results.filter(r => r.error).map(r => r.error);

            if (errors.length > 0) {
                console.error("[useUpdateOrder] Errors on pick updates:", errors);
                throw new Error("Ocurrió un error al reorganizar los picks.");
            }
        } catch (error: any) {
             console.error("[useUpdateOrder]", error);
             useAlertStore.getState().addAlert({ message: error.message, type: AlertType.ERROR });
             throw error;
        } finally {
            setLoading(false);
        }
    };

    const updateBanOrder = async (bansToUpdate: Ban[]) => {
        setLoading(true);
        try {
            const promises = bansToUpdate.map(ban => 
                supabase.from('bans').update({ ban_order: ban.ban_order }).eq('id', ban.id)
            );

            const results = await Promise.all(promises);
            const errors = results.filter(r => r.error).map(r => r.error);

            if (errors.length > 0) {
                console.error("[useUpdateOrder] Errors on ban updates:", errors);
                throw new Error("Ocurrió un error al reorganizar los bans.");
            }
        } catch (error: any) {
             console.error("[useUpdateOrder]", error);
             useAlertStore.getState().addAlert({ message: error.message, type: AlertType.ERROR });
             throw error;
        } finally {
            setLoading(false);
        }
    };

    return {
        updatePickOrder,
        updateBanOrder,
        loading
    };
};
