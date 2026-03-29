import { Team } from "@/stores/teamStore";

export interface Match {
    id: number;
    best_of: number;
    is_live: boolean;
    finished: boolean;
    created_at: string;
    room_id: string;
    team_a_id: number;
    team_b_id: number;
    team_a?: Team;
    team_b?: Team;
}