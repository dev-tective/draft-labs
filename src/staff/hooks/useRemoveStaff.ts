import { useState } from "react";
import { supabase } from "@/supabaseClient";
import { useUserStore } from "@/stores/userStore";
import { useAlertStore, AlertType } from "@/stores/alertStore";

export const useRemoveStaff = () => {
    const [loading, setLoading] = useState(false);
    const user = useUserStore((state) => state.user);
    const addAlert = useAlertStore((state) => state.addAlert);

    const removeStaff = async (staffId: number) => {
        if (!user) throw new Error("No existe el usuario");

        setLoading(true);
        try {
            const { error } = await supabase.rpc("remove_staff", {
                p_staff_id: staffId,
                p_user_id: user.id,
            });

            if (error) throw error;

            addAlert({
                message: "Se removio al jugador de la sala",
                type: AlertType.SUCCESS
            });
        } catch (error: any) {
            addAlert({
                message: error.message || "No se pudo remover el jugador de la sala",
                type: AlertType.ERROR,
            });
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return { removeStaff, loading };
};