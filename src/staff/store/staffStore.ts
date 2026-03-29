import { create } from "zustand";
import { supabase } from "@/supabaseClient";
import { RealtimeChannel } from "@supabase/supabase-js";
import { Staff } from "@/staff/staff.types";
import { useUserStore } from "@/stores/userStore";

const STAFF_WITH_ROOMS = `
    *,
    rooms (
        id, created_at, game,
        bans_per_team, is_global_ban,
        staff ( count )
    )
`;

interface StaffState {
    myStaff: Staff[];
    myStaffLoading: boolean;
    _myStaffChannel: RealtimeChannel | null;
    subscribeToMyStaff: () => Promise<void>;
    unsubscribeFromMyStaff: () => void;
}

export const useStaffStore = create<StaffState>((set, get) => ({
    myStaff: [],
    myStaffLoading: false,
    _myStaffChannel: null,

    subscribeToMyStaff: async () => {
        const user = useUserStore.getState().user;
        if (!user || get()._myStaffChannel) return;

        set({ myStaffLoading: true });

        const channel = supabase
            .channel(`my-staff-${user.id}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "staff",
                    filter: `user_id=eq.${user.id}`,
                },
                async (payload) => {
                    const { eventType, new: newRow, old: oldRow } = payload;

                    if (eventType === "DELETE") {
                        set((s) => ({
                            myStaff: s.myStaff.filter((st) => st.id !== (oldRow as Staff).id),
                        }));
                        return;
                    }

                    const { data: fresh, error } = await supabase
                        .from("staff")
                        .select(STAFF_WITH_ROOMS)
                        .eq("id", (newRow as Staff).id)
                        .single();

                    if (error || !fresh) return;

                    if (eventType === "INSERT") {
                        set((s) => ({ myStaff: [fresh as Staff, ...s.myStaff] }));
                    } else {
                        set((s) => ({
                            myStaff: s.myStaff.map((st) =>
                                st.id === fresh.id ? (fresh as Staff) : st
                            ),
                        }));
                    }
                }
            )
            .subscribe();

        set({ _myStaffChannel: channel });

        const { data, error } = await supabase
            .from("staff")
            .select(STAFF_WITH_ROOMS)
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("[staffStore] Error en fetch inicial:", error);
            set({ myStaffLoading: false });
            return;
        }

        set({ myStaff: (data as Staff[]) ?? [], myStaffLoading: false });
    },

    unsubscribeFromMyStaff: () => {
        const { _myStaffChannel } = get();
        if (_myStaffChannel) {
            supabase.removeChannel(_myStaffChannel);
            set({ _myStaffChannel: null, myStaff: [], myStaffLoading: false });
        }
    },
}));

// Auto-disparo: escucha cambios en userStore y suscribe/desuscribe automáticamente
useUserStore.subscribe((state, prev) => {
    const store = useStaffStore.getState();

    if (state.user && !prev.user) {
        store.subscribeToMyStaff();
    }

    if (!state.user && prev.user) {
        store.unsubscribeFromMyStaff();
    }
});