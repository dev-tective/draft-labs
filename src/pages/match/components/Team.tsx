import { useRef } from "react";
import { Icon } from "@iconify/react";
import { EditTeamModal } from "@/components/modals/EditTeamModal";
import { CreateTeamModal } from "@/components/modals/CreateTeamModal";
import { ModalRef } from "@/layout/ModalLayout";
import { EditPlayerModal } from "@/components/modals/EditPlayerModal";
import { useTeamStore } from "@/stores/teamStore";
import { usePlayerStore } from "@/stores/playerStore";
import { useMatchStore } from "@/stores/matchStore";
import { useAlertStore, AlertType } from "@/stores/alertStore";
import DEFAULT_LOGO from "@/assets/ui/shield.svg";
import { DragDropProvider, useDragDropMonitor, useDroppable } from "@dnd-kit/react";
import { Player as PlayerType } from "@/stores/playerStore";
import { Team as TeamType } from "@/stores/teamStore";
import { useShallow } from "zustand/react/shallow";
import { ActivePlayer } from "./player/ActivePlayer";
import { InactivePlayer } from "./player/InactivePlayer";
import { SortableZone } from "@/components/SortableZone";

interface Props {
    index: number;
    reverse?: boolean;
}

const ActiveZone = ({ teamId, droppableId }: { teamId: string; droppableId: string }) => {
    const { ref, isDropTarget } = useDroppable({ id: droppableId });
    const { updatePlayer, updatePlayersContext } = usePlayerStore();

    const activePlayers = usePlayerStore(
        useShallow((state) =>
            state.players.filter((p) => p.team_id === teamId && p.is_active)
        )
    );
    
    const activeCount = activePlayers.length;

    useDragDropMonitor({
        onDragEnd({ operation, canceled }) {
            if (canceled) return;

            const player = operation.source?.data?.player as PlayerType | undefined;
            if (!player || `player_actives_${player.team_id}` !== droppableId) return;

            if (operation.target?.id !== droppableId) return;
            if (player.is_active) return;

            if (activeCount >= 5) {
                useAlertStore.getState().addAlert({
                    message: 'A team can have a maximum of 5 active players',
                    type: AlertType.WARNING,
                });
                return;
            }

            updatePlayer({ id: player.id, is_active: true, order: activeCount + 1 });
        }
    });

    return (
        <div className="flex flex-col gap-2 mb-5">
            <div className="text-slate-200 uppercase font-bold flex justify-between">
                <span>Active Players</span>
                <span className="tracking-widest">{activeCount}/5</span>
            </div>
            <div className={`
                min-h-12 rounded-lg border-2 border-dashed
                flex flex-col gap-2 p-2
                transition-colors duration-200
                ${isDropTarget
                    ? 'border-cyan-400 bg-cyan-400/10'
                    : 'border-slate-700 bg-slate-800/20'
                }
            `}>
                <SortableZone
                    className="flex-col gap-2"
                    items={activePlayers}
                    onDropOutside={(player) => updatePlayer({ id: player.id as string, is_active: false, order: null })}
                    onReorder={(items) => updatePlayersContext(items as { id: string; order: number }[])}
                    renderItem={(player, index) => (
                        <ActivePlayer
                            key={player.id}
                            player={player as PlayerType}
                            index={index}
                        />
                    )}
                />

                {(activeCount < 5) && (
                    <span
                        ref={ref}
                        className={`
                        h-15 content-center
                        text-xs font-bold 
                        uppercase tracking-widest
                        text-center
                        ${isDropTarget ? 'text-cyan-400' : 'text-slate-400'}
                    `}
                    >
                        {isDropTarget ? 'Release to activate' : 'Drag here to activate'}
                    </span>
                )}
            </div>
        </div>
    );
};

const TeamPlayers = ({ team }: { team: TeamType }) => {
    const droppableId = `player_actives_${team.id}`;
    const inactivePlayers = usePlayerStore(
        useShallow((state) =>
            state.players.filter((p) => p.team_id === team.id && !p.is_active)
        )
    );

    return (
        <DragDropProvider>
            <ActiveZone teamId={team.id} droppableId={droppableId} />
            {inactivePlayers.map((player) => (
                <InactivePlayer key={player.id} player={player} />
            ))}
        </DragDropProvider>
    );
};

export const Team = ({ index, reverse = false }: Props) => {
    const createTeamModalRef = useRef<ModalRef>(null);
    const editTeamModalRef = useRef<ModalRef>(null);
    const createPlayerModalRef = useRef<ModalRef>(null);

    const team = useTeamStore((state) => state.teams[index]);
    const { deleteTeam } = useTeamStore();
    const { currentMatch } = useMatchStore();

    if (!team) return (
        <>
            <CreateTeamModal ref={createTeamModalRef} />
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
                <button
                    onClick={() => createTeamModalRef.current?.open()}
                    className="
                        w-20 h-20 rounded-full
                        border-2 border-dashed
                        flex items-center justify-center
                        transition-all
                        text-slate-200
                        border-slate-600
                        hover:border-slate-200
                    "
                >
                    <Icon icon="mdi:plus" className="text-4xl" />
                </button>
                <span className="text-slate-200">Create Team</span>
            </div>
        </>
    );

    return (
        <>
            <EditTeamModal ref={editTeamModalRef} team={team} />

            <EditPlayerModal
                ref={createPlayerModalRef}
                player={{
                    id: '',
                    nickname: '',
                    team_id: team.id,
                    created_at: '',
                    is_active: false,
                    match_id: currentMatch?.id ?? '',
                }}
                teamId={team.id}
                createMode
            />

            <div className={`
                relative flex-1 flex
                border
                bg-slate-900/30
                after:content-['']
                after:absolute
                after:w-1
                after:h-1/2
                after:top-1/2
                after:-translate-y-1/2
                after:bg-slate-500
                text-slate-700
                ${reverse ?
                    'beveled-br-tl rounded-tl-3xl rounded-br-3xl after:right-0'
                    : 'beveled-bl-tr rounded-tr-3xl rounded-bl-3xl after:left-0'}
            `}>
                <div className="flex flex-col w-full p-8 gap-8">
                    <div className={`
                        flex items-center justify-between
                        pb-5 border-b
                        ${reverse && 'flex-row-reverse'}
                    `}>
                        <div className={`flex items-center gap-3 ${reverse && 'flex-row-reverse'}`}>
                            <div className="space-y-2">
                                <Icon
                                    icon="mdi:close-bold"
                                    width="25"
                                    height="25"
                                    onClick={() => deleteTeam(team.id)}
                                    className="cursor-pointer text-slate-200 hover:text-fuchsia-500 transition-colors"
                                />
                                <Icon
                                    icon="ri:edit-fill"
                                    width="25"
                                    height="25"
                                    onClick={() => editTeamModalRef.current?.open()}
                                    className="cursor-pointer text-slate-200 hover:text-cyan-400 transition-colors"
                                />
                            </div>
                            <div className={`flex flex-col ${reverse && 'items-end'}`}>
                                <h1 className="text-2xl font-bold italic tracking-wider uppercase text-slate-200">
                                    {team.name}
                                </h1>
                                <h2 className="text-lg font-semibold uppercase text-slate-200">
                                    <span className="mr-2 text-slate-400">
                                        Coach:
                                    </span>
                                    {team.coach || 'No coach'}
                                </h2>
                            </div>
                        </div>

                        <div className="h-12 aspect-square">
                            <img
                                src={team.logo_url || DEFAULT_LOGO}
                                alt={team.name}
                                className="object-cover h-full mx-auto"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <TeamPlayers team={team} />
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
                            <Icon icon="mdi:plus" width="40" height="40" className="text-slate-200" />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};