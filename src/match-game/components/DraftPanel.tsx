import { Team } from "@/stores/teamStore";
import { PickSlotOrder } from "./PickSlotOrder";
import { Pick, Ban } from "../match-game.types";
import { BanSlot } from "./BanSlot";

interface Props {
    team: Team;
    alternative: boolean;
    picks: Pick[];
    bans: Ban[];
}

export const DraftPanel = ({ team, alternative, picks, bans }: Props) => {
    const { id, name } = team;

    return (
        <div className="
            flex-1 flex flex-col
            gap-2 
        ">
            <span className={`
                border-b-2 text-center
                text-lg font-bold py-2
                uppercase tracking-widest
                ${alternative ? 'text-cyan-400 border-cyan-500/30' : 'text-fuchsia-400 border-fuchsia-500/30'}
            `}>
                {name}
            </span>

            <div className="flex-1 flex flex-col gap-2">
                <div className="h-16 flex gap-1">
                    {bans.map((ban) => (
                    <BanSlot 
                        key={ban.id} 
                        ban={ban} 
                    />
                ))}
                </div>
                <PickSlotOrder picks={picks} />
            </div>
        </div>
    );
};
