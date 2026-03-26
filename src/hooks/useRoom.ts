import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';
import { useUserStore } from '@/stores/userStore';
import { AlertType, useAlertStore } from '@/stores/alertStore';

export enum StaffRole {
    STAFF = 'staff',
    OWNER = 'owner',
}

export enum RoomGame {
    MLBB = 'mlbb',
    LOL = 'lol',
    DOTA2 = 'dota2',
}

export interface Room {
    id: number;
    created_at: string;
    game: RoomGame;
    bans_per_team: number;
    is_global_ban: boolean;
}

export interface Staff {
    id: number;
    room_id: number;
    role: StaffRole;
    created_at: string;
    rooms: Room;
}

export interface CreateRoomParams {
    game?: RoomGame;
    bans_per_team?: number;
    is_global_ban?: boolean;
}

const STAFF_WITH_ROOMS = `*, rooms(*)`;

export const useStaffs = () => {
    const user = useUserStore((state) => state.user);
    
    return useQuery({
        queryKey: ['staffs', user?.id],
        enabled: !!user,
        queryFn: async () => {
            if (!user) throw new Error('No existe el usuario');

            const { data, error } = await supabase
                .from('staff')
                .select(STAFF_WITH_ROOMS)
                .eq('user_id', user.id);
                
                if (error) throw error;

            return data as Staff[];
        },
    });
};

export const useCreateRoom = () => {
    const queryClient = useQueryClient();
    const user = useUserStore((state) => state.user);
    const addAlert = useAlertStore((state) => state.addAlert);

    return useMutation({
        mutationFn: async (params: CreateRoomParams = {}) => {
            if (!user) throw new Error('No existe el usuario');

            const { data, error } = await supabase.rpc('create_room', {
                p_user_id: user.id,
                p_game: params.game ?? RoomGame.MLBB,
                p_bans_per_team: params.bans_per_team ?? 5,
                p_is_global_ban: params.is_global_ban ?? false,
            });

            if (error) throw error;

            // El SP retorna { room_id, staff_id }
            return data[0] as { room_id: number; staff_id: number };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staffs', user?.id] });
            addAlert({
                message: "Se ha creado la sala",
                type: AlertType.SUCCESS,
            });
        },
        onError: (error) => {
            addAlert({
                message: error.message || "No se pudo crear la sala",
                type: AlertType.ERROR,
            });
        },
    });
};

export const useCreateStaff = () => {
    const queryClient = useQueryClient();
    const user = useUserStore((state) => state.user);
    const addAlert = useAlertStore((state) => state.addAlert);

    return useMutation({
        mutationFn: async (roomId: number) => {
            if (!user) throw new Error('No existe el usuario');

            // Obtener staffs actuales desde el cache de TanStack Query
            const currentStaffs = queryClient.getQueryData<Staff[]>(['staffs', user.id]) || [];
            
            const alreadyIn = currentStaffs.some((s) => s.room_id === roomId);
            if (alreadyIn) throw new Error('Ya eres staff de esta sala');

            const { data, error } = await supabase
                .from('staff')
                .insert([{ user_id: user.id, room_id: roomId, role: StaffRole.STAFF }])
                .select(STAFF_WITH_ROOMS)
                .single();

            if (error) throw error;

            return data as Staff;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staffs', user?.id] });
            addAlert({
                message: "Se ha unido a la sala",
                type: AlertType.SUCCESS,
            });
        },
        onError: (error) => {
            addAlert({
                message: error.message || "No se pudo unir a la sala",
                type: AlertType.ERROR,
            });
        }
    });
};

export const useRemoveStaff = () => {
    const queryClient = useQueryClient();
    const user = useUserStore((state) => state.user);
    const addAlert = useAlertStore((state) => state.addAlert);

    return useMutation({
        mutationFn: async (staffId: number) => {
            if (!user) throw new Error('No existe el usuario');

            const { error } = await supabase.rpc('remove_staff', {
                p_staff_id: staffId,
                p_user_id: user.id,
            });

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staffs'] });
            addAlert({
                message: "Has salido de la sala",
                type: AlertType.SUCCESS,
            });
        },
        onError: (error) => {
            addAlert({
                message: error.message || "No pudiste salir de la sala",
                type: AlertType.ERROR,
            });
        }
    });
};