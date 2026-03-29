export enum RoomGame {
    MLBB = 'MLBB',
    LOL = 'LOL',
}

export interface Room {
    id: string;
    created_at: string;
    game: RoomGame;
    bans_per_team: number;
    is_global_ban: boolean;
    staff: [{ count: number }];
}

