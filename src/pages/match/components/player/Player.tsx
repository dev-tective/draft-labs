import { Icon } from "@iconify/react";
import { useRef } from "react";
import { EditPlayerModal } from "../../../../components/modals/EditPlayerModal";
import { ModalRef } from "../../../../layout/ModalLayout";
import { usePlayerStore, Player as PlayerType } from "@/stores/playerStore";
import DEFAULT_IMAGE from "@/assets/ui/silueta.png";

interface Props {
    player: PlayerType;
    dragRef: (element: HTMLElement | null) => void;
    isDragging: boolean;
    prefix?: React.ReactNode;
    sensorIcon: string;
    sensorColor: string;
    onToggleActive: () => void;
}

export const PlayerTemplate = ({
    player,
    dragRef,
    isDragging,
    prefix,
    sensorIcon,
    sensorColor,
    onToggleActive,
}: Props) => {
    const editPlayerModalRef = useRef<ModalRef>(null);
    const { deletePlayer, updateLoading } = usePlayerStore();

    return (
        <div
            ref={dragRef}
            className={`
                relative flex items-center gap-5
                w-full p-3
                border beveled-br-tl
                rounded-br-2xl
                transition-opacity
                ${isDragging ? 'opacity-40' : 'bg-slate-700/20'}
            `}
        >
            {prefix}

            <div className="h-15 aspect-square overflow-hidden bg-white">
                <img
                    src={player.image_url || DEFAULT_IMAGE}
                    alt={player.nickname}
                    className="object-cover"
                />
            </div>

            <div className="uppercase truncate">
                <h1 className="text-lg font-semibold text-slate-200">
                    {player.nickname}
                </h1>
                <p className="text-sm tracking-wider text-slate-400">
                    {player.lane?.name || 'No lane'}
                </p>
            </div>

            <div className="flex items-center flex-col md:flex-row gap-2 ml-auto text-slate-200">
                {/* Toggle activo / inactivo */}
                <button
                    onClick={onToggleActive}
                    disabled={updateLoading}
                    title={player.is_active ? 'Deactivate player' : 'Activate player'}
                    className={`transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${sensorColor}`}
                >
                    {updateLoading
                        ? <Icon icon="mdi:loading" width="25" height="25" className="animate-spin" />
                        : <Icon icon={sensorIcon} width="25" height="25" />
                    }
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
                    teamId={player.team_id}
                />
            </div>

            <button
                onClick={() => deletePlayer(player.id)}
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
