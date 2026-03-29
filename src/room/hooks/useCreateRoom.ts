import { useState } from "react";
import { supabase } from "@/supabaseClient";
import { useUserStore } from "@/stores/userStore";
import { useAlertStore, AlertType } from "@/stores/alertStore";
import { RoomGame } from "@/room/room.types";
import { useRoomStore } from "@/room/store/roomStore";

interface CreateRoomParams {
    game?: RoomGame;
    bans_per_team?: number;
    is_global_ban?: boolean;
    teams?: any[];
}

export const useCreateRoom = () => {
    const { subscribeToRoomStaff } = useRoomStore();
    const [loading, setLoading] = useState(false);

    const user = useUserStore((state) => state.user);
    const addAlert = useAlertStore((state) => state.addAlert);

    const createRoom = async (params: CreateRoomParams = {}) => {
        if (!user) throw new Error("No existe el usuario");

        setLoading(true);
        
        try {
            const { data, error } = await supabase.rpc("create_room", {
                p_user_id: user.id,
                p_game: params.game ?? RoomGame.MLBB,
                p_bans_per_team: params.bans_per_team ?? 5,
                p_is_global_ban: params.is_global_ban ?? false,
                p_teams: params.teams ?? [],
            });

            if (error) throw error;

            const result = data[0] as { room_id: string; staff_id: number };

            if (result.room_id) {
                await subscribeToRoomStaff(result.room_id);
                
                addAlert({
                    message: "Se ha creado la sala",
                    type: AlertType.SUCCESS,
                });
            }
        } catch (error: any) {
            addAlert({
                message: error.message || "No se pudo crear la sala",
                type: AlertType.ERROR,
            });
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return { createRoom, loading };
};