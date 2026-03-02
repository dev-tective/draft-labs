import { useUpdateGame } from "@/hooks/useGames";
import { Match } from "@/hooks/useMatch";
import { Team } from "@/hooks/useTeam";
import { usePicksStore } from "@/stores/picksStore";
import { useDragDropMonitor, useDroppable } from "@dnd-kit/react";
import { Icon } from "@iconify/react";
import { TeamCard } from "./TeamCard";
import { AlertType, useAlertStore } from "@/stores/alertStore";

interface Props {
    winnerTeamId?: string | null;
    match: Match;
}

export const WinnerSlot = ({ winnerTeamId, match }: Props) => {
    const { ref, isDropTarget } = useDroppable({ id: "winner-slot" });
    const gameId = usePicksStore((state) => state.currentGameId);
    const { mutateAsync: updateGame, isPending } = useUpdateGame();
    const addAlert = useAlertStore((state) => state.addAlert);

    useDragDropMonitor({
        onDragEnd(event) {
            console.log("Drag ended!", event);
            const { operation, canceled } = event;

            if (canceled) {
                console.log("Drag canceled");
                return;
            }

            console.log("Operation:", operation);

            if (operation.target?.id === 'winner-slot' && match.id && gameId) {
                const droppedTeam = operation.source?.data?.team as Team | undefined;
                console.log("Dropped team:", droppedTeam, operation.source);
                if (droppedTeam && droppedTeam.id !== winnerTeamId) {
                    console.log("Updating game with team:", droppedTeam.id);
                    updateGame({
                        id: gameId,
                        match_id: match.id,
                        winner_team_id: droppedTeam.id
                    });
                }
            }
        }
    });

    const handleClearWinner = () => {
        if (gameId && match.id) {
            updateGame({
                id: gameId,
                match_id: match.id,
                winner_team_id: null
            });
        }
    };

    const winner = match.teams.find((t) => t.id === winnerTeamId);

    return (
        <div className="flex w-full max-w-96 items-center gap-2 relative">
            <span className="text-slate-400 text-sm font-medium uppercase">
                Winner:
            </span>

            {/* crown */}
            {winner &&
                <button
                    title="Clear Winner"
                    disabled={isPending}
                    onClick={() => addAlert({
                        message: "Are you sure you want to clear the winner?",
                        type: AlertType.WARNING,
                        handleAction: handleClearWinner,
                        duration: 10000
                    })}
                    className="
                        absolute top-0 -left-4 z-10
                        text-slate-200 hover:text-fuchsia-500
                        transition-colors cursor-pointer
                    "
                >
                    <Icon
                        icon="icon-park-solid:clear-format"
                        width={30}
                        height={30}
                    />
                </button>
            }

            <TeamCard
                ref={ref}
                team={winner}
                isEmpty={!winner && !isPending}
                isActive={!!winner}
                isDropTarget={isDropTarget}
                isPending={isPending}
                rightIcon={
                    winner ? <Icon icon="ph:trophy-duotone" className="text-cyan-400 text-3xl" /> : undefined
                }
            />
        </div>
    );
};
