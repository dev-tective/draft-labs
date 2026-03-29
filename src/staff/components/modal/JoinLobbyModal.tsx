import { forwardRef, useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { ModalLayout, ModalRef } from "@/layout/ModalLayout";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useCreateStaff } from "@/staff/hooks/useCreateStaff";
import { AlertType, useAlertStore } from "@/stores/alertStore";
import { useStaffStore } from "@/staff/store/staffStore";
import { useRemoveStaff } from "@/staff/hooks/useRemoveStaff";
import { Staff, StaffRole } from "@/staff/staff.types";
import { useRoomStore } from "@/room/store/roomStore";

export const JoinLobbyModal = forwardRef<ModalRef, {}>((_props, ref) => {
    const [manualId, setManualId] = useState("");

    // ── Store (reemplaza useStaffs) ──────────────────────────
    const { myStaff, myStaffLoading, subscribeToMyStaff } = useStaffStore();
    const { loading, createStaff } = useCreateStaff();

    // Suscribir al abrir el modal
    useEffect(() => {
        subscribeToMyStaff();
    }, []);

    const closeModal = () => {
        if (ref && typeof ref !== 'function' && ref.current) {
            ref.current.close();
            setManualId("");
        }
    };

    const handleJoinById = async () => {
        if (!manualId.trim()) return;
        try {
            await createStaff(manualId.trim());
            closeModal();
        } catch (err: any) {
            throw err;
        }
    };

    return (
        <ModalLayout ref={ref}>
            <div className="
                absolute flex flex-col
                max-w-4xl w-11/12
                p-5 md:p-8 gap-6
                rounded-tr-3xl rounded-bl-3xl
                beveled-bl-tr border beveled
                bg-slate-950 border-cyan-800 
                max-h-[90vh] overflow-hidden
            ">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl md:text-2xl text-slate-200 uppercase tracking-widest font-bold italic">
                            Salas
                        </h1>
                        <p className="text-cyan-500 text-xs md:text-sm tracking-wider uppercase">
                            Selecciona una sala o busca por ID
                        </p>
                    </div>
                    <button
                        onClick={closeModal}
                        className="text-slate-500 hover:text-fuchsia-500 transition-colors"
                    >
                        <Icon icon="mdi:close" className="text-3xl" />
                    </button>
                </div>

                {/* Manual ID Input */}
                <div className="space-y-4">
                    <h2 className="flex items-center text-xs md:text-sm text-slate-200 uppercase tracking-widest">
                        <Icon
                            icon="fluent:key-multiple-20-filled"
                            className="text-lg md:text-2xl mr-3 text-fuchsia-500"
                        />
                        Ingresar por ID
                    </h2>

                    <div className="flex flex-wrap gap-3">
                        <input
                            value={manualId}
                            onChange={(e) => setManualId(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleJoinById()}
                            placeholder="ID de la sala"
                            className="
                                flex-1 px-4 py-3
                                bg-slate-900/50
                                border border-slate-700
                                rounded-tr-xl rounded-bl-xl beveled-bl-tr
                                text-slate-200 placeholder:text-slate-600
                                focus:outline-none focus:border-fuchsia-500
                                transition-colors
                            "
                        />
                        <button
                            onClick={handleJoinById}
                            disabled={!manualId.trim() || loading}
                            className="
                                px-6 py-3
                                text-sm font-bold uppercase tracking-widest beveled-bl-tr
                                border rounded-tr-xl rounded-bl-xl
                                bg-fuchsia-950/70 border-fuchsia-400 text-fuchsia-400
                                transition-all
                                hover:bg-fuchsia-400 hover:text-slate-950
                                disabled:opacity-50 disabled:cursor-not-allowed
                                flex items-center justify-center gap-2
                            "
                        >
                            {loading ? (
                                <Icon icon="line-md:loading-twotone-loop" className="text-xl" />
                            ) : (
                                "Unirse"
                            )}
                        </button>
                    </div>
                </div>

                {/* Staff List */}
                <div className="space-y-4 flex-1 overflow-hidden flex flex-col custom-scrollbar">
                    <h2 className="flex items-center text-xs md:text-sm text-slate-200 uppercase tracking-widest">
                        <Icon
                            icon="fluent:people-team-20-filled"
                            className="text-lg md:text-2xl mr-3 text-cyan-400"
                        />
                        Mis salas
                    </h2>

                    {myStaffLoading ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-10">
                            <LoadingSpinner size="lg" />
                            <p className="mt-4 text-xs uppercase tracking-widest text-slate-500 animate-pulse">
                                Sincronizando salas...
                            </p>
                        </div>
                    ) : myStaff.length === 0 ? (
                        <div className="text-center py-10 text-slate-500">
                            <Icon icon="mdi:inbox" className="text-6xl mx-auto mb-4" />
                            <p className="text-sm uppercase tracking-wider">
                                No estás en ninguna sala
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                            {myStaff.map((s) => (
                                <LobbyCard
                                    key={s.id}
                                    staff={s}
                                    handleClose={closeModal}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </ModalLayout>
    );
});

// LobbyCard sin cambios — solo tipado desde el store
const LobbyCard = ({ staff, handleClose }: { staff: Staff, handleClose: () => void }) => {
    const { removeStaff, loading } = useRemoveStaff();
    const { subscribeToRoomStaff, roomStaffLoading } = useRoomStore();
    const addAlert = useAlertStore((state) => state.addAlert);

    const { id, room_id, role, rooms, created_at } = staff;
    const isOwner = role === StaffRole.OWNER;
    const isLoading = loading || roomStaffLoading;

    const handleRemoveStaff = (e: React.MouseEvent) => {
        e.stopPropagation(); // evita navegar al hacer click en el botón
        addAlert({
            message: "¿Estás seguro de que quieres salir de la sala? (Si eres dueño de la sala, se eliminará)",
            type: AlertType.WARNING,
            handleAction: () => removeStaff(id),
        });
    };

    const handleSubscribe = () => {
        handleClose();
        subscribeToRoomStaff(room_id);
    }

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={handleSubscribe}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSubscribe();
                }
            }}
            className="
                p-4
                bg-slate-900/30
                border border-slate-700
                rounded-tr-xl rounded-bl-xl beveled-bl-tr
                hover:border-cyan-500 hover:bg-slate-900/50
                cursor-pointer transition-all
            "
        >
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-cyan-400 uppercase">
                            {rooms.game}
                        </span>
                        <span className="text-xs text-slate-500">
                            {rooms.bans_per_team} bans/equipo
                        </span>
                        {isOwner && (
                            <span className="
                                flex items-center gap-1
                                text-xs font-bold uppercase tracking-wider
                                text-amber-400 border border-amber-400/40
                                bg-amber-400/10 px-2 py-0.5 rounded-full
                            ">
                                <Icon icon="mdi:crown" className="text-sm" />
                                Líder
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-slate-400 font-mono">
                        ID: {room_id}
                    </p>
                    <p className="text-sm text-slate-400 font-mono">
                        MIEMBROS: {rooms.staff[0].count}/20
                    </p>
                    <p className="text-xs text-slate-500">
                        {new Date(created_at).toLocaleDateString('es', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleRemoveStaff}
                        disabled={isLoading}
                        title={isOwner ? "Eliminar sala" : "Abandonar sala"}
                        className="
                            p-2 rounded-lg
                            text-slate-500 hover:text-fuchsia-500
                            transition-all
                            disabled:opacity-50 disabled:cursor-not-allowed
                        "
                    >
                        {isLoading ? (
                            <Icon icon="mdi:loading" className="text-xl animate-spin" />
                        ) : (
                            <Icon
                                icon={isOwner ? "mdi:trash-can-outline" : "mdi:exit-to-app"}
                                className="text-xl"
                            />
                        )}
                    </button>
                    <Icon
                        icon="mdi:arrow-right"
                        className="text-2xl text-slate-500"
                    />
                </div>
            </div>
        </div>
    );
};