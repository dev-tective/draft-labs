import { Room } from "@/room/room.types";

export enum StaffRole {
    STAFF = 'staff',
    OWNER = 'owner',
}

export interface Staff {
    id: number;
    room_id: string;
    role: StaffRole;
    created_at: string;
    rooms: Room;
    users?: { username: string };
}