import { create } from "zustand";
import { supabaseCloud as supabase } from "../supabaseClient";
import { RoomGame } from "@/room/room.types";

export interface Tag {
    id: number;
    name: string;
    game: RoomGame;
    image?: string;
    active?: boolean;
    created_at: string;
}

interface TagsStore {
    lanes: Tag[];
    maps: Tag[];
    selectedLane: number;
    loading: boolean;
    error: string | null;

    getLanes: (game: RoomGame) => Promise<void>;
    findLane: (id: number) => Tag | undefined;

    getMaps: (game: RoomGame) => Promise<void>;
    findMap: (id: number) => Tag | undefined;
}

export const useTagStore = create<TagsStore>((set, get) => ({
    lanes: [],
    maps: [],
    selectedLane: 0,
    loading: false,
    error: null,

    getLanes: async (game: RoomGame = RoomGame.MLBB) => {
        set({
            loading: true,
            error: null
        });

        try {
            const { data, error } = await supabase
                .from('lanes')
                .select('*')
                .order('name', { ascending: true })
                .eq('game', game);

            if (error) throw error;

            console.log(data);

            set({
                lanes: data || [],
                loading: false,
                error: null,
                selectedLane: 0
            });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Error al cargar datos',
                loading: false,
                lanes: [],
                selectedLane: 0
            });
        }
    },

    findLane: (id: number) => {
        return get().lanes.find((lane) => lane.id === id);
    },

    getMaps: async (game: RoomGame = RoomGame.MLBB) => {
        set({
            loading: true,
            error: null
        });

        try {
            const { data, error } = await supabase
                .from('maps')
                .select('*')
                .eq('game', game);

            if (error) throw error;

            console.log(data);

            set({
                maps: data || [],
                loading: false,
                error: null
            });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Error al cargar datos',
                loading: false,
                maps: []
            });
        }
    },

    findMap: (id: number) => {
        return get().maps.find((map) => map.id === id);
    }
}))