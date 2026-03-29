import { create } from "zustand";
import { supabase } from "@/supabaseClient";
import { RealtimeChannel } from "@supabase/supabase-js";
import { Staff } from "@/staff/staff.types";
import { Room } from "@/room/room.types";
import { AlertType, useAlertStore } from "@/stores/alertStore";

const ROOM_INITIAL_SELECT = `
    *,
    rooms (*),
    users (username)
`;

const STAFF_REALTIME_SELECT = `
    *,
    users (username)
`;

interface RoomState {
    roomStaff: Staff[];
    roomStaffLoading: boolean;
    activeRoom: Room | null;
    _roomStaffChannel: RealtimeChannel | null;
    subscribeToRoomStaff: (roomId: string) => Promise<void>;
    unsubscribeFromRoomStaff: () => void;
    _updateRoomCount: (delta: 1 | -1) => void;
}

export const useRoomStore = create<RoomState>((set, get) => ({
    roomStaff: [],
    roomStaffLoading: false,
    activeRoom: null,
    _roomStaffChannel: null,

    _updateRoomCount: (delta: 1 | -1) => {
        const { activeRoom } = get();
        if (!activeRoom || !activeRoom.staff?.[0]) return;

        set({
            activeRoom: {
                ...activeRoom,
                staff: [{ count: activeRoom.staff[0].count + delta }],
            },
        });
    },

    subscribeToRoomStaff: async (roomId: string) => {
        if (get().activeRoom?.id === roomId && get()._roomStaffChannel) return;

        get().unsubscribeFromRoomStaff();
        set({ roomStaffLoading: true, activeRoom: null });

        const channel = supabase
            .channel(`room-staff-${roomId}`)
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "staff", filter: `room_id=eq.${roomId}` },
                async (payload) => {
                    const { eventType, new: newRow, old: oldRow } = payload;
                    const addAlert = useAlertStore.getState().addAlert;

                    if (eventType === "DELETE") {
                        const removed = get().roomStaff.find((st) => st.id === (oldRow as Staff).id);
                        set((s) => ({
                            roomStaff: s.roomStaff.filter((st) => st.id !== (oldRow as Staff).id),
                        }));
                        get()._updateRoomCount(-1);
                        addAlert({
                            message: `${removed?.users?.username ?? "Un usuario"} fue eliminado de la sala.`,
                            type: AlertType.INFO,
                        });
                        return;
                    }

                    const { data: fresh, error } = await supabase
                        .from("staff")
                        .select(STAFF_REALTIME_SELECT)
                        .eq("id", (newRow as Staff).id)
                        .single();

                    if (error || !fresh) return;

                    if (eventType === "INSERT") {
                        set((s) => ({ roomStaff: [...s.roomStaff, fresh as Staff] }));
                        get()._updateRoomCount(1);
                        addAlert({
                            message: `${fresh.users?.username ?? "Un usuario"} se unió a la sala.`,
                            type: AlertType.INFO,
                        });
                    } else {
                        set((s) => ({
                            roomStaff: s.roomStaff.map((st) =>
                                st.id === fresh.id ? (fresh as Staff) : st
                            ),
                        }));
                    }
                }
            )
            .subscribe();

        set({ _roomStaffChannel: channel });

        const { data, error } = await supabase
            .from("staff")
            .select(ROOM_INITIAL_SELECT)
            .eq("room_id", roomId)
            .order("created_at", { ascending: true });

        if (error) {
            set({ roomStaffLoading: false });
            return;
        }

        if (data && data.length > 0) {
            set({
                roomStaff: data as Staff[],
                activeRoom: data[0].rooms as Room,
            });
        }

        set({ roomStaffLoading: false });
    },

    unsubscribeFromRoomStaff: () => {
        const { _roomStaffChannel } = get();
        if (_roomStaffChannel) {
            supabase.removeChannel(_roomStaffChannel);
            set({
                _roomStaffChannel: null,
                roomStaff: [],
                roomStaffLoading: false,
                activeRoom: null,
            });
        }
    },
}));