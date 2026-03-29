import { Team } from "@/stores/teamStore";
import { Match } from "../match.types";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import { useDeleteMatch } from "../hooks/useDeleteMatch";

interface MatchCardProps {
    match: Match;
}

export const MatchCard = ({ match }: MatchCardProps) => {
    const navigate = useNavigate();
    const { deleteMatch } = useDeleteMatch();

    // From SP definition, team_a is Red and team_b is Blue
    const teamRed = match.team_a;
    const teamBlue = match.team_b;

    let statusLabel = "en espera";
    let statusColor = "text-slate-400";
    let statusIcon = "mdi:clock-outline";

    if (match.finished) {
        statusLabel = "finalizado";
        statusColor = "text-fuchsia-400";
        statusIcon = "mdi:check-circle";
    } else if (match.is_live) {
        statusLabel = "en vivo";
        statusColor = "text-cyan-400";
        statusIcon = "mdi:record-circle";
    }

    return (
        <div
            onClick={() => navigate(`/matches/${match.id}`)}
            className="
                group relative flex flex-col p-5 gap-4
                border beveled-bl-tr rounded-tr-3xl rounded-bl-3xl border-slate-800 
                bg-slate-900/40
            "
        >
            <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-2">
                    <Icon icon="mdi:format-list-numbered" className="text-amber-500" />
                    <span className="text-xs text-amber-500 font-bold uppercase tracking-widest">
                        BO{match.best_of}
                    </span>
                </div>

                <div className={`flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest ${statusColor}`}>
                    <Icon icon={statusIcon} className="text-sm" />
                    <span>{statusLabel}</span>
                </div>
            </div>

            <div className="flex flex-row items-center justify-between gap-3">
                {teamBlue && renderTeam(teamBlue, "blue")}

                <div className="flex flex-col items-center justify-center shrink-0">
                    <span className="text-xl italic font-black text-slate-700 group-hover:text-cyan-500 transition-colors">VS</span>
                </div>

                {teamRed && renderTeam(teamRed, "red")}
            </div>

            <div className="flex justify-end absolute -bottom-6 right-6 gap-2">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        deleteMatch(match.id);
                    }}
                    className="
                        px-3 py-2 flex items-center justify-center
                        bg-slate-950 border border-slate-700 
                        text-slate-500 hover:text-fuchsia-400 hover:border-fuchsia-400/50
                        beveled-bl-tr rounded-tr-lg rounded-bl-lg
                        transition-all cursor-pointer
                    "
                    title="Eliminar Match"
                >
                    <Icon icon="mdi:trash-can-outline" className="text-lg" />
                </button>

                <div className="
                    px-5 py-2 flex items-center gap-1
                    bg-slate-950 border border-slate-700 
                    text-xs text-slate-400 font-bold uppercase tracking-widest 
                    beveled-bl-tr rounded-tr-lg rounded-bl-lg
                    hover:border-cyan-500 hover:text-cyan-400 transition-colors
                ">
                    Ingresar <Icon icon="mdi:arrow-right" />
                </div>
            </div>
        </div>
    );
};

const renderTeam = (team: Team, color: "blue" | "red") => {
    const text = color === "blue" ? "text-cyan-400" : "text-fuchsia-400";

    return (
        <div className={`flex flex-col items-center justify-center py-4 px-2 rounded-xl flex-1`}>
            <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-900 border border-slate-700/50 mb-3 flex items-center justify-center shadow-lg">
                {team?.logo_url ? (
                    <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
                ) : (
                    <Icon icon="mdi:shield" className={`text-2xl ${text}`} />
                )}
            </div>
            <p className={`text-sm font-bold uppercase tracking-widest text-center px-1 ${text}`}>
                {team?.name ?? "TBD"}
            </p>
            <p className="text-[10px] text-slate-500 uppercase font-semibold mt-1">
                {team?.acronym ?? "N/A"}
            </p>
        </div>
    );
};