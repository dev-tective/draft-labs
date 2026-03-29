import { useRef, useState, useEffect } from "react";
import { useRoomStore } from "../store/roomStore";
import { useRemoveStaff } from "@/staff/hooks/useRemoveStaff";
import { useUserStore } from "@/stores/userStore";
import { Staff, StaffRole } from "@/staff/staff.types";
import { Icon } from "@iconify/react";
import { useAlertStore, AlertType } from "@/stores/alertStore";

export const RoomStaff = () => {
    const { roomStaff } = useRoomStore();
    const user = useUserStore((s) => s.user);
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Determinar si el usuario actual es owner en esta sala
    const myEntry = roomStaff.find((s) => s.users?.username === user?.username);
    const isOwner = myEntry?.role === StaffRole.OWNER;

    // Cerrar al hacer click fuera
    useEffect(() => {
        if (!open) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open]);

    return (
        <div
            ref={containerRef}
            className="fixed bottom-5 right-5"
        >
            {/* Trigger button */}
            <button
                onClick={() => setOpen((prev) => !prev)}
                className={`
                    flex items-center gap-3 w-full
                    px-5 py-3
                    border-2 rounded-tr-2xl rounded-bl-2xl beveled-bl-tr
                    transition-all duration-200
                    text-sm font-bold uppercase tracking-widest
                    ${open
                        ? "bg-cyan-950 border-cyan-400 text-cyan-300"
                        : "bg-slate-900 border-slate-700 text-slate-200 hover:border-slate-500 hover:text-slate-200"
                    }
                `}
            >
                <Icon icon="material-symbols:group" className="text-xl shrink-0" />
                <span className="flex-1 text-left">
                    Staff — {roomStaff.length} / 20
                </span>
                <Icon
                    icon="mdi:chevron-up"
                    className={`text-xl transition-transform duration-200 ${open ? "rotate-180" : "rotate-0"}`}
                />
            </button>

            {/* Dropdown panel — opens upward */}
            {open && (
                <div className="
                    absolute bottom-full mb-2 left-0 right-0 z-20
                    bg-slate-950 border border-slate-700
                    rounded-tl-2xl rounded-br-2xl beveled-br-tl
                    shadow-xl shadow-black/50
                    overflow-hidden
                    animate-fade-in
                ">
                    {roomStaff.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                            <Icon icon="mdi:account-off-outline" className="text-4xl mb-2" />
                            <p className="text-xs uppercase tracking-widest">Sin miembros</p>
                        </div>
                    ) : (
                        <ul className="max-h-64 overflow-y-auto divide-y divide-slate-800/60 custom-scrollbar">
                            {roomStaff.map((staff) => (
                                <StaffRow
                                    key={staff.id}
                                    staff={staff}
                                    canRemove={isOwner}
                                    isMe={staff.users?.username === user?.username}
                                />
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
};

// ─── Row individual ────────────────────────────────────────────────────────────
const StaffRow = ({
    staff,
    canRemove,
    isMe,
}: {
    staff: Staff;
    canRemove: boolean;
    isMe: boolean;
}) => {
    const { removeStaff, loading } = useRemoveStaff();
    const addAlert = useAlertStore((s) => s.addAlert);
    const isOwner = staff.role === StaffRole.OWNER;

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        addAlert({
            message: `¿Eliminar a "${staff.users?.username}" de la sala?`,
            type: AlertType.WARNING,
            handleAction: () => removeStaff(staff.id),
        });
    };

    return (
        <li className="flex items-center gap-3 px-4 py-3 hover:bg-slate-900/50 transition-colors">
            {/* Username & role */}
            <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${isMe ? "text-cyan-400" : "text-slate-200"}`}>
                    {staff.users?.username ?? "—"}
                    {isMe && <span className="ml-2 text-[10px] text-cyan-600 uppercase">(tú)</span>}
                </p>
                <p className={`text-[10px] uppercase tracking-wider font-bold ${isOwner ? "text-amber-400" : "text-slate-500"}`}>
                    {isOwner ? (
                        <span className="flex items-center gap-1">
                            <Icon icon="mdi:crown" className="text-xs" />
                            Líder
                        </span>
                    ) : "Staff"}
                </p>
            </div>

            {/* Remove button — only for owner, and not for themselves */}
            {canRemove && !isOwner && (
                <button
                    onClick={handleRemove}
                    disabled={loading}
                    title="Eliminar staff"
                    className="
                        p-1.5 rounded-lg
                        text-slate-600 hover:text-fuchsia-500
                        transition-all disabled:opacity-40 disabled:cursor-not-allowed
                    "
                >
                    {loading
                        ? <Icon icon="mdi:loading" className="text-2xl animate-spin" />
                        : <Icon icon="mdi:account-remove" className="text-2xl" />
                    }
                </button>
            )}
        </li>
    );
};