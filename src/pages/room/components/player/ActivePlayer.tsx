import { Player } from "@/stores/teamStore";
import { useUpdatePlayer } from "@/hooks/usePlayer";
import { PlayerTemplate } from "./Player";
import { useSortable } from "@dnd-kit/react/sortable";

export const ActivePlayer = ({ player, index = 0 }: { player: Player, index: number }) => {
    const { ref, isDragging } = useSortable({
        id: player.id,
        data: { player },
        index,
    });

    const { updatePlayer } = useUpdatePlayer();

    return (
        <PlayerTemplate
            player={player}
            dragRef={ref}
            isDragging={isDragging}
            sensorIcon="material-symbols:sensors-krx"
            sensorColor="hover:text-fuchsia-400"
            onToggleActive={() => updatePlayer({ id: player.id, is_active: false })}
        />
    );
};
