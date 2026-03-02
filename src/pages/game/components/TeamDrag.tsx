import { Team } from "@/hooks/useTeam";
import { useDraggable } from "@dnd-kit/react";
import { Icon } from "@iconify/react";
import { TeamCard } from "./TeamCard";

interface Props {
    team: Team;
    disabled?: boolean;
}

export const TeamDrag = ({ team, disabled = false }: Props) => {
    const { ref, isDragging } = useDraggable({
        id: team.id,
        data: { team },
        disabled,
    });

    return (
        <TeamCard
            ref={ref}
            team={team}
            isDragging={isDragging}
            className="cursor-grab active:cursor-grabbing"
            rightIcon={
                <Icon
                    icon="material-symbols:drag-indicator"
                    className="text-slate-400 text-3xl"
                />
            }
        />
    );
};