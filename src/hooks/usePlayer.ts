import { useState } from "react";
import { supabase } from "@/supabaseClient";
import { AlertType, useAlertStore } from "@/stores/alertStore";
import { Player } from "@/stores/teamStore";

const alert = (message: string, type: AlertType) =>
    useAlertStore.getState().addAlert({ message, type });

export const useCreatePlayer = () => {
    const [loading, setLoading] = useState(false);

    const createPlayer = async (params: Partial<Player>) => {
        setLoading(true);
        try {
            const { error } = await supabase
                .from('players')
                .insert({
                    nickname: params.nickname,
                    team_id: params.team_id,
                    room_id: params.room_id,
                    profile_url: params.profile_url ?? null,
                    lane: params.lane ?? null,
                    order: params.order ?? null,
                    is_active: params.is_active ?? false,
                })
                .select('*')
                .single();

            if (error) {
                alert(error.message, AlertType.ERROR);
                throw error;
            }

            alert("Jugador creado correctamente", AlertType.SUCCESS);
        } finally {
            setLoading(false);
        }
    };

    return { createPlayer, loading };
};

export const useUpdatePlayer = () => {
    const [loading, setLoading] = useState(false);

    const updatePlayer = async (params: Partial<Player>) => {
        setLoading(true);
        try {
            const {
                id,
                room_id: _room_id,
                team_id: _team_id,
                created_at: _created_at,
                ...updateData
            } = params;

            const { error } = await supabase
                .from('players')
                .update(updateData)
                .eq('id', id);

            if (error) {
                alert(error.message, AlertType.ERROR);
                throw error;
            }

            alert("Jugador actualizado correctamente", AlertType.SUCCESS);
        } finally {
            setLoading(false);
        }
    };

    return { updatePlayer, loading };
};

export const useUpdatePlayersOrder = () => {
    return async (playersToUpdate: { id: number; order: number }[]) => {
        const promises = playersToUpdate.map((p) =>
            supabase.from('players').update({ order: p.order }).eq('id', p.id)
        );

        const results = await Promise.all(promises);
        const failed = results.filter((r) => r.error);

        if (failed.length > 0) {
            alert('Algunos jugadores no pudieron ser reordenados', AlertType.ERROR);
            throw new Error('Partial order update failure');
        }
    };
};

export const useDeletePlayer = () => {
    return (playerId: number) => {
        useAlertStore.getState().addAlert({
            message: '¿Estás seguro de que quieres eliminar este jugador?',
            type: AlertType.WARNING,
            handleAction: async () => {
                const { error } = await supabase
                    .from('players')
                    .delete()
                    .eq('id', playerId);

                if (error) {
                    alert(error.message, AlertType.ERROR);
                    return;
                }

                alert('El jugador fue eliminado correctamente', AlertType.SUCCESS);
            },
        });
    };
};