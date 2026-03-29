import { ModalRef } from "@/layout/ModalLayout";
import { Player, useTeamStore } from "@/stores/teamStore";

import { useDraggable } from "@dnd-kit/react";
import { useRef } from "react";
import DEFAULT_IMAGE from "@/assets/ui/silueta.png"
import { Icon } from "@iconify/react";
import { EditPlayerModal } from "@/components/modals/EditPlayerModal";

export const PlayerRow = ({ player }: { player: Player }) => {
    const { id, is_active, lane, nickname, profile_url, team_id } = player;
    const editPlayerModalRef = useRef<ModalRef>(null);
    const { updatePlayer, deletePlayer } = useTeamStore();

    const { ref, isDragging } = useDraggable({
        id,
        data: { player },
    });

    const onToggleActive = () => {
        updatePlayer({ id, is_active: !is_active, team_id });
    };


    return (
        <div
            ref={ref}
            className={`
                relative flex items-center gap-5
                w-full p-3
                border beveled-br-tl
                rounded-br-2xl
                transition-opacity
                ${isDragging ? 'opacity-40' : 'bg-slate-700/20'}
            `}
        >
            <div className="h-15 aspect-square overflow-hidden bg-white">
                <img
                    src={profile_url || DEFAULT_IMAGE}
                    alt={nickname}
                    className="object-cover"
                />
            </div>

            <div className="uppercase truncate">
                <h1 className="text-lg font-semibold text-slate-200">
                    {nickname}
                </h1>
                <p className="text-sm tracking-wider text-slate-400">
                    {lane?.name || 'No lane'}
                </p>
            </div>

            <div className="flex items-center flex-col md:flex-row gap-2 ml-auto text-slate-200">
                {/* Toggle activo / inactivo */}
                <button
                    onClick={onToggleActive}
                    title={is_active ? 'Deactivate player' : 'Activate player'}
                    className={`
                        transition-colors hover:opacity-80 
                        ${is_active ? 'hover:text-fuchsia-400' : 'hover:text-cyan-400'}
                    `}
                >
                    <Icon
                        icon={is_active ? "material-symbols:sensors-krx" : "material-symbols:sensors-krx-outline"}
                        width="25"
                        height="25"
                    />
                </button>

                <Icon
                    icon="ri:edit-fill"
                    width="25"
                    height="25"
                    onClick={() => editPlayerModalRef.current?.open()}
                    className="cursor-pointer hover:text-cyan-400 transition-colors"
                />

                <EditPlayerModal
                    ref={editPlayerModalRef}
                    player={player}
                />
            </div>

            <button
                onClick={() => deletePlayer(player.id, team_id)}

                className="
                        absolute -top-3 -right-3
                        bg-slate-500 rounded-full p-0.5
                        hover:bg-fuchsia-600 transition-colors
                    "
            >
                <Icon
                    icon="mdi:close"
                    width="25"
                    height="25"
                    className="cursor-pointer text-slate-100"
                />
            </button>
        </div>
    );
};
