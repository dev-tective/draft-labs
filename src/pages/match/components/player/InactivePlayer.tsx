import { useDraggable } from "@dnd-kit/react";
import { Player, usePlayerStore } from "@/stores/playerStore";
import { useAlertStore, AlertType } from "@/stores/alertStore";
import { PlayerTemplate } from "./Player";

export const InactivePlayer = ({ player }: { player: Player }) => {
    const { ref, isDragging } = useDraggable({
        id: player.id,
        data: { player },
    });

    const { updatePlayer } = usePlayerStore();

    const handleUpdatePlayer = () => {
        const activePlayers = usePlayerStore.getState()
            .players
            .filter((p) => p.team_id === player.team_id && p.is_active)
            .length;

        if (activePlayers >= 5) {
            useAlertStore.getState().addAlert({
                message: 'A team can have a maximum of 5 active players',
                type: AlertType.WARNING,
            });
            return;
        }

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
