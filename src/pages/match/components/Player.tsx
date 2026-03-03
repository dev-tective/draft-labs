import { Icon } from "@iconify/react";
import { useRef } from "react";
import { EditPlayerModal } from "../../../components/modals/EditPlayerModal";
import { ModalRef } from "../../../layout/ModalLayout";
import { usePlayerStore, Player as PlayerType } from "@/stores/playerStore";
import DEFAULT_IMAGE from "@/assets/ui/silueta.png";
import { useDraggable } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";

interface PlayerProps {
    player: PlayerType;
    index?: number;
}

export const Player = ({ player }: PlayerProps) => {
    const { ref, isDragging } = useDraggable({
        id: player.id,
        data: { player },
    });
    const editPlayerModalRef = useRef<ModalRef>(null);

    const { deletePlayer } = usePlayerStore();

    return (
        <>
            <EditPlayerModal
                ref={editPlayerModalRef}
                player={player}
                teamId={player.team_id}
            />

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
                        src={player.image_url || DEFAULT_IMAGE}
                        alt={player.nickname}
                        className="object-cover"
                    />
                </div>

                <div className="uppercase">
                    <h1 className="text-lg font-semibold text-slate-200">
                        {player.nickname}
                    </h1>
                    <p className="text-sm tracking-wider text-slate-400">
                        {player.lane?.name || 'No lane'}
                    </p>
                </div>

                <Icon
                    icon="ri:edit-fill"
                    width="25"
                    height="25"
                    onClick={() => editPlayerModalRef.current?.open()}
                    className="
                        inline-block ml-auto
                        cursor-pointer text-slate-200
                        hover:text-cyan-400 transition-colors
                    "
                />

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
        </>
    );
};

export const PlayerSortable = ({ player, index = 1 }: PlayerProps) => {
    const { ref, isDragging } = useSortable({
        id: player.id,
        data: { player },
        index
    });
    const editPlayerModalRef = useRef<ModalRef>(null);

    const { deletePlayer } = usePlayerStore();

    return (
        <>
            <EditPlayerModal
                ref={editPlayerModalRef}
                player={player}
                teamId={player.team_id}
            />

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
                <span className="text-slate-200 text-xl font-bold w-5 text-center">
                    {index + 1}
                </span>
                <div className="h-15 aspect-square overflow-hidden bg-white">
                    <img
                        src={player.image_url || DEFAULT_IMAGE}
                        alt={player.nickname}
                        className="object-cover"
                    />
                </div>

                <div className="uppercase">
                    <h1 className="text-lg font-semibold text-slate-200">
                        {player.nickname}
                    </h1>
                    <p className="text-sm tracking-wider text-slate-400">
                        {player.lane?.name || 'No lane'}
                    </p>
                </div>

                <Icon
                    icon="ri:edit-fill"
                    width="25"
                    height="25"
                    onClick={() => editPlayerModalRef.current?.open()}
                    className="
                        inline-block ml-auto
                        cursor-pointer text-slate-200
                        hover:text-cyan-400 transition-colors
                    "
                />

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
        </>
    );
};
