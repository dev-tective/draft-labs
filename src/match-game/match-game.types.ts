import { Hero } from "@/stores/heroesStore";
import { Tag } from "@/stores/tagStore";
import { Player, Team } from "@/stores/teamStore";

export enum GameState {
    WAITING = 'en espera',
    IN_PROGRESS = 'en progreso',
    FINISHED = 'finalizado',
}

export interface MatchGame {
    id: number;
    created_at: string;
    match_id: number;
    game_number: number;
    map: Tag;
    winner_team_id: number;
    team_blue_id: number;
    team_red_id: number;
    team_blue?: Team;
    team_red?: Team;
    status: GameState;
    picksRed: Pick[];
    picksBlue: Pick[];
    bansRed: Ban[];
    bansBlue: Ban[];
}

export interface Pick {
    id: number;
    created_at: string;
    hero_id: number | null;
    player_id: number;
    pick_order: number;
    is_locked: boolean;
    is_active: boolean;
    team_id: number;
    game_id: number;
    hero?: Hero;
    player: Player;
}

export interface Ban {
    id: number;
    created_at: string;
    hero_id: number | null;
    ban_order: number;
    is_locked: boolean;
    is_active: boolean;
    team_id: number;
    game_id: number;
    hero?: Hero;
}