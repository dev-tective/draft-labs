import { Copy } from "@/components/Copy";
import { CutOutBtn, CutOutBtnPrimary } from "@/components/CutOutBtn";
import { CreateRoomModal } from "@/room/components/modal/CreateRoomModal";
import { JoinLobbyModal } from "@/staff/components/modal/JoinLobbyModal";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { WarningMessage } from "@/components/shared/WarningMessage";
import { ModalRef } from "@/layout/ModalLayout";
import { AlertType } from "@/stores/alertStore";
import { useTeamStore } from "@/stores/teamStore";
import { Icon } from "@iconify/react";
import { useEffect, useRef } from "react";
import { TeamContainer } from "./components/TeamContainer";
import { CreateTeamModal } from "@/components/modals/CreateTeamModal";
import { useRoomStore } from "@/room/store/roomStore";
import { Param } from "@/components/Param";
import { RoomStaff } from "./components/RoomStaff";

export const RoomPage = () => {
    const { roomStaffLoading, activeRoom } = useRoomStore();
    const createRoomModalRef = useRef<ModalRef>(null);
    const joinLobbyModalRef = useRef<ModalRef>(null);

    return (
        <div className="min-h-full flex flex-col relative">
            <div className="
                sticky top-0 z-10
                flex flex-col lg:flex-row
                w-full gap-4 p-4
                bg-slate-950
                border-b border-slate-700
            ">
                <div className="flex-1 md:flex-none lg:w-md">
                    <CreateRoomModal ref={createRoomModalRef} />
                    <CutOutBtnPrimary
                        icon="material-symbols:dashboard-customize"
                        text="Crear Sala"
                        onClick={() => createRoomModalRef.current?.open()}
                    />
                </div>
                <div className="flex gap-4 w-full lg:max-w-sm">
                    <JoinLobbyModal ref={joinLobbyModalRef} />
                    <CutOutBtn
                        icon="material-symbols:sensor-door"
                        text="Unirse"
                        onClick={() => joinLobbyModalRef.current?.open()}
                    />
                </div>
            </div>

            <div className="flex flex-1 w-11/12 space-y-10 mx-auto py-6 md:py-10">
                {roomStaffLoading ? (
                    <LoadingSpinner message="Cargando sala..." />
                ) : !activeRoom ? (
                    <WarningMessage
                        title="Sala no encontrada"
                        message="No se encontro una sala activa. Crea una nueva sala o uneete a una existente."
                    />
                ) : (
                    <RoomContent />
                )}
            </div>
        </div>
    );
};

const RoomContent = () => {
    const { roomStaffLoading, activeRoom: room } = useRoomStore();
    const { teams, subscribeToRoom, loading } = useTeamStore();
    const createTeamModalRef = useRef<ModalRef>(null);

    useEffect(() => {
        if (room?.id) {
            subscribeToRoom(room.id);
        }
    }, [room?.id]);

    if (roomStaffLoading || loading) return <LoadingSpinner message="Cargando equipos..." />;

    return (
        <div className="w-full flex flex-col gap-8 pb-20">
            {/* Header with ID and Match Settings */}
            <div className="
                        flex flex-col xl:flex-row items-start justify-between
                        gap-4 pb-4
                        border-b border-slate-700
                    ">
                {/* Match ID */}
                <div className="flex hover:text-cyan-400 transition-colors w-full xl:w-auto">
                    <Icon
                        icon="mage:key-fill"
                        className="text-2xl mr-2"
                    />
                    <Copy
                        value={room?.id!}
                        copy={room?.id!}
                        alert={{
                            message: "ID de la sala copiado al portapapeles.",
                            type: AlertType.INFO
                        }}
                        className="font-semibold"
                    />
                </div>

                {/* Room params */}
                <div className="flex flex-wrap gap-4 items-center">
                    <Param
                        label="Juego"
                        param={room?.game!}
                    />
                    <Param
                        label="Bans por equipo"
                        param={room?.bans_per_team!}
                    />
                    <Param
                        label="Ban Global"
                        param={room?.is_global_ban!}
                    />
                </div>
            </div>

            {/* Teams — with slide navigation when there are more than 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <CreateTeamModal
                    ref={createTeamModalRef}
                    roomId={room?.id!}
                />
                <div className="flex-1 flex flex-col items-center justify-center gap-3">
                    <button
                        onClick={() => createTeamModalRef.current?.open()}
                        className="
                            flex-1 flex flex-col items-center justify-center
                            w-full min-h-50
                            border-2 border-dashed
                            transition-all
                            text-slate-200
                            border-slate-600
                            hover:border-slate-200
                            beveled-bl-tr rounded-tr-3xl rounded-bl-3xl after:left-0
                        "
                    >
                        <Icon icon="mdi:plus" className="text-4xl" />
                        <span className="text-slate-200">Crear Equipo</span>
                    </button>
                </div>
                {teams.map((team, index) => (
                    <TeamContainer
                        key={team.id}
                        team={team}
                        reverse={index % 2 === 0}
                    />
                ))}
            </div>

            {/* Staff panel — siempre al final */}
            <RoomStaff />
        </div>
    );
}

