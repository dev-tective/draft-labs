import { Player, usePlayerStore } from "@/stores/playerStore";
import { PlayerTemplate } from "./Player";
import { useSortable } from "@dnd-kit/react/sortable";

export const ActivePlayer = ({ player, index = 0 }: { player: Player, index: number }) => {
    const { ref, isDragging } = useSortable({
        id: player.id,
        data: { player },
        index,
    });

    const { updatePlayer } = usePlayerStore();

    return (
        <PlayerTemplate
            player={player}
            dragRef={ref}
            isDragging={isDragging}
            prefix={
                <span className="text-slate-200 text-xl font-bold w-5 text-center">
                    {player.order}
                </span>
            }
            sensorIcon="material-symbols:sensors-krx"
            sensorColor="hover:text-fuchsia-400"
            onToggleActive={() => updatePlayer({ id: player.id, is_active: false })}
        />
    );
};
