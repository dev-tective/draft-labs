import { supabase } from "@/supabaseClient";
import { AlertType, useAlertStore } from "@/stores/alertStore";
import { Team, Player } from "@/stores/teamStore";
import { useState } from "react";


const alert = (message: string, type: AlertType) =>
    useAlertStore.getState().addAlert({ message, type });

export const useCreateTeam = () => {
    const [loading, setLoading] = useState(false);

    const createTeam = async (params: Partial<Team>, players?: Partial<Player>[]) => {
        setLoading(true);

        try {
            const { data, error } = await supabase.rpc('create_team_with_players', {
                p_room_id: params.room_id,
                p_name: params.name,
                p_acronym: params.acronym ?? null,
                p_logo_url: params.logo_url ?? null,
                p_coach: params.coach ?? null,
                p_players: players ?? [],
            });

            if (error) throw error;

            setLoading(false);

            alert(`El equipo "${params.name}" fue creado`, AlertType.SUCCESS);

            return data;
        } catch (err: any) {
            setLoading(false);
            alert(err.message, AlertType.ERROR);
            throw err;
        }
    };

    return {
        loading,
        createTeam,
    };
};

export const useUpdateTeam = () => {
    const [loading, setLoading] = useState(false);

    const updateTeam = async (params: Partial<Team>) => {
        setLoading(true);
        const { id, room_id: _room_id, created_at: _created_at, players: _players, ...updateData } = params;

        try {
            const { error } = await supabase
                .from('teams')
                .update(updateData)
                .eq('id', id);

            if (error) throw error;

            alert(`El equipo "${updateData.name}" fue actualizado`, AlertType.SUCCESS);
        } catch (error: any) {
            alert(error.message, AlertType.ERROR);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        updateTeam,
    };
};

export const useDeleteTeam = () => {
    const [loading, setLoading] = useState(false);

    const deleteTeam = (teamId: number) => {
        useAlertStore.getState().addAlert({
            message: '¿Estás seguro de que quieres eliminar este equipo?',
            type: AlertType.WARNING,
            handleAction: async () => {
                setLoading(true);
                try {
                    const { error } = await supabase
                        .from('teams')
                        .delete()
                        .eq('id', teamId);

                    if (error) throw error;

                    alert('El equipo fue eliminado correctamente', AlertType.SUCCESS);
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
        deleteTeam,
    };
};