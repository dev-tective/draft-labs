import { useDraggable } from "@dnd-kit/react";
import { Player } from "@/stores/teamStore";
import { useUpdatePlayer } from "@/hooks/usePlayer";
import { PlayerTemplate } from "./Player";

export const InactivePlayer = ({ player }: { player: Player }) => {
    const { ref, isDragging } = useDraggable({
        id: player.id,
        data: { player },
    });

    const { updatePlayer } = useUpdatePlayer();

    const handleUpdatePlayer = () => {
        // if (activeCount >= 5) {
        //     useAlertStore.getState().addAlert({
        //         message: 'A team can have a maximum of 5 active players',
        //         type: AlertType.WARNING,
        //     });
        //     return;
        // }

        updatePlayer({ id: player.id, is_active: true });
    };

    return (
        <PlayerTemplate
            player={player}
            dragRef={ref}
            isDragging={isDragging}
            sensorIcon="material-symbols:sensors-krx-outline"
            sensorColor="hover:text-cyan-400"
            onToggleActive={handleUpdatePlayer}
        />
    );
};
