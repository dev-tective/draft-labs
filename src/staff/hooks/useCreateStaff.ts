import { useState } from "react";
import { supabase } from "@/supabaseClient";
import { useUserStore } from "@/stores/userStore";
import { useAlertStore, AlertType } from "@/stores/alertStore";
import { useStaffStore } from "@/staff/store/staffStore";
import { StaffRole } from "@/staff/staff.types";

export const useCreateStaff = () => {
    const [loading, setLoading] = useState(false);
    const user = useUserStore((state) => state.user);
    const addAlert = useAlertStore((state) => state.addAlert);
    const { myStaff } = useStaffStore();

    const createStaff = async (roomId: string) => {
        if (!user) throw new Error("No existe el usuario");

        const alreadyIn = myStaff.some((s) => s.room_id === roomId);
        if (alreadyIn) throw new Error("Ya eres staff de esta sala");

        setLoading(true);
        try {
            const { error } = await supabase
                .from("staff")
                .insert([{ user_id: user.id, room_id: roomId, role: StaffRole.STAFF }])
                .single();

            if (error) throw error;

            addAlert({ message: "Se ha unido a la sala", type: AlertType.SUCCESS });
        } catch (error: any) {
            addAlert({
                message: error.message || "No se pudo unir a la sala",
                type: AlertType.ERROR,
            });
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return { createStaff, loading };
};
