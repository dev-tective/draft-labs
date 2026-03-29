import { useRef } from "react";
import { Icon } from "@iconify/react";
import { EditTeamModal } from "@/components/modals/EditTeamModal";
import { ModalRef } from "@/layout/ModalLayout";
import { EditPlayerModal } from "@/components/modals/EditPlayerModal";
import { useAlertStore, AlertType } from "@/stores/alertStore";
import DEFAULT_LOGO from "@/assets/ui/shield.svg";
import { DragDropProvider, useDragDropMonitor, useDroppable } from "@dnd-kit/react";
import { Player, Team, useTeamStore } from "@/stores/teamStore";
import { useDeleteTeam } from "@/hooks/useTeam";

import { PlayerRow } from "./PlayerRow";

interface Props {
    team: Team;
    reverse?: boolean;
}

export const TeamContainer = ({ team, reverse = false }: Props) => {
    const { name, logo_url } = team;
    const createPlayerModalRef = useRef<ModalRef>(null);
    const { loadingTeamIds } = useTeamStore();

    const isLoading = loadingTeamIds.has(team.id);

    return (
        <div className={`
            overflow-hidden
            relative flex-1 flex flex-col 
            w-full p-8 gap-8 
            border bg-slate-900/30
            text-slate-700
            ${reverse ?
                'beveled-br-tl rounded-tl-3xl rounded-br-3xl' :
                'beveled-bl-tr rounded-tr-3xl rounded-bl-3xl'}
        `}>
            {isLoading && (
                <div className={`
                    absolute inset-0 z-1 
                    flex items-center justify-center 
                    bg-slate-900/60 backdrop-blur-md
                    transition-all duration-500
                    animate-in fade-in
                    ${reverse ? 
                        'rounded-tl-3xl rounded-br-3xl' : 
                        'rounded-tr-3xl rounded-bl-3xl'}
                `}>
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative">
                            <Icon 
                                icon="line-md:loading-twotone-loop" 
                                className="text-cyan-400 text-7xl drop-shadow-[0_0_20px_rgba(34,211,238,0.8)]" 
                            />
                            <div className="absolute inset-0 bg-cyan-400/20 blur-2xl rounded-full animate-pulse" />
                        </div>
                        <span className="text-sm uppercase tracking-[0.4em] font-bold text-cyan-400 animate-pulse drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]">
                            Actualizando
                        </span>
                    </div>
                </div>
            )}

            <div className={`
                absolute w-1 h-1/2 
                -translate-y-1/2 top-1/2
                bg-slate-500 
                ${reverse ? 'right-0' : 'left-0'}
            `} />

            <div className={`
                flex items-center justify-between
                pb-5 border-b
                ${reverse && 'flex-row-reverse'}
            `}>
                <TeamActions
                    team={team}
                    reverse={reverse}
                />

                <div className="h-12 aspect-square">
                    <img
                        src={logo_url || DEFAULT_LOGO}
                        alt={name}
                        className="object-cover h-full mx-auto"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <DragDropProvider>
                    <PlayersZoneContent team={team} />
                </DragDropProvider>
                <button
                    onClick={() => createPlayerModalRef.current?.open()}
                    className="
                        relative flex items-center justify-center 
                        gap-5 w-full py-4
                        border-2 border-dashed beveled-br-tl 
                        rounded-br-2xl 
                        bg-slate-700/10 opacity-70 
                        hover:opacity-100 transition-opacity
                    "
                >
                    <Icon
                        icon="mdi:plus"
                        width="40"
                        height="40"
                        className="text-slate-200"
                    />
                </button>

                <EditPlayerModal
                    ref={createPlayerModalRef}
                    player={{
                        id: 0,
                        nickname: '',
                        team_id: team.id,
                        room_id: team.room_id,
                        created_at: '',
                        is_active: false,
                    }}
                    createMode
                />
            </div>
        </div>
    );
};

const PlayersZoneContent = ({ team }: { team: Team }) => {
    const { id, players } = team;
    const droppableId = `player_actives_${id}`;
    
    const { updatePlayer } = useTeamStore();
    const { ref, isDropTarget } = useDroppable({ id: droppableId });


    const inactivePlayers = players.filter((p) => !p.is_active);
    const activePlayers = players.filter((p) => p.is_active);
    const activeCount = activePlayers.length;

    useDragDropMonitor({
        onDragEnd({ operation, canceled }) {
            if (canceled) return;

            const player = operation.source?.data?.player as Player | undefined;
            if (!player || player.team_id !== id) return;

            const isDroppedInActiveZone = operation.target?.id === droppableId;

            // 1. Activar jugador (soltado dentro de la zona activa)
            if (isDroppedInActiveZone && !player.is_active) {
                if (activeCount >= 5) {
                    useAlertStore.getState().addAlert({
                        message: 'Un equipo puede tener un máximo de 5 jugadores activos',
                        type: AlertType.WARNING,
                    });
                    return;
                }
                updatePlayer({ id: player.id as number, is_active: true, team_id: id });
                return;
            }

            // 2. Desactivar jugador (soltado fuera de la zona activa)
            if (!isDroppedInActiveZone && player.is_active) {
                updatePlayer({ id: player.id as number, is_active: false, team_id: id });
            }
        }
    });

    return (
        <>
            <div className="flex flex-col gap-2 mb-5">
                <div className="text-slate-200 uppercase font-bold flex justify-between">
                    <span>Active Players</span>
                    <span className="tracking-widest">{activeCount}/5</span>
                </div>
                <div
                    ref={ref}
                    className={`
                        min-h-12 rounded-lg border-2 border-dashed
                        flex flex-col gap-2 p-2
                        transition-colors duration-200
                        ${isDropTarget
                            ? 'border-cyan-400 bg-cyan-400/10'
                            : 'border-slate-700 bg-slate-800/20'
                        }
                    `}
                >
                    {activePlayers.map((player) => (
                        <PlayerRow
                            key={player.id}
                            player={player}
                        />
                    ))}

                    {(activeCount < 5) && (
                        <span className={`
                            h-15 content-center
                            text-xs font-bold 
                            uppercase tracking-widest
                            text-center
                            ${isDropTarget ? 'text-cyan-400' : 'text-slate-400'}
                        `}>
                            {isDropTarget ? 'Liberar para activar' : 'Arrastra para activar'}
                        </span>
                    )}
                </div>
            </div>

            {/* Jugadores inactivos (ya no necesitan una zona droppable específica) */}
            {inactivePlayers.map((player) => (
                <PlayerRow
                    key={player.id}
                    player={player}
                />
            ))}
        </>
    );
};

const TeamActions = ({ team, reverse }: { team: Team, reverse: boolean }) => {
    const { id, name, acronym, coach } = team;
    const editTeamModalRef = useRef<ModalRef>(null);
    const { deleteTeam, loading: isDeleting } = useDeleteTeam();

    return (
        <div className={`flex items-center gap-3 ${reverse && 'flex-row-reverse'}`}>
            <div className="space-y-2">
                <Icon
                    icon="mdi:close-bold"
                    width="25"
                    height="25"
                    onClick={() => !isDeleting && deleteTeam(id)}
                    className="cursor-pointer text-slate-200 hover:text-fuchsia-500 transition-colors"
                />
                <Icon
                    icon="ri:edit-fill"
                    width="25"
                    height="25"
                    onClick={() => editTeamModalRef.current?.open()}
                    className="cursor-pointer text-slate-200 hover:text-cyan-400 transition-colors"
                />
                <EditTeamModal
                    ref={editTeamModalRef}
                    team={team}
                />
            </div>
            <div className={`flex flex-col ${reverse && 'items-end'}`}>
                <div className={`
                    flex justify-between gap-2
                    text-slate-200 text-2xl 
                    font-bold italic tracking-wider uppercase
                    ${reverse && 'flex-row-reverse'}
                `}>
                    <h1>{name}</h1>
                    <h1 className={`${reverse ?
                        'border-r-2 pr-2' : 'border-l-2 pl-2'} 
                        border-slate-600 text-sm not-italic
                    `}>
                        {acronym}
                    </h1>
                </div>
                <h2 className="text-lg font-semibold uppercase text-slate-200">
                    <span className="mr-2 text-slate-400">
                        Coach:
                    </span>
                    {coach ?? 'No coach'}
                </h2>
            </div>
        </div>
    )
}
