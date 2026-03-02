import { create } from 'zustand';
import { supabase } from '../supabaseClient';
import { Game } from '../hooks/useMatch';
import { Tag } from './tagsStore';

// Interface para la tabla heroes - ahora con lanes y roles completos
export interface Hero {
    id: number;
    name: string;
    image_profile_url: string;
    image_slot_url: string;
    game: Game;
    lanes: Tag[];
    roles: Tag[];
}

interface HeroesState {
    // Heroes
    allHeroes: Hero[];
    heroes: Hero[];
    searchQuery: string

    isLoading: boolean;
    error: string | null;

    fetchHeroes: (game?: Game) => Promise<void>;
    setSearchQuery: (query: string) => void;
    filterHeroesByName: (query: string) => void;
    filterHeroesByLane: (laneId: number) => void;
    findHeroById: (heroId: number | null) => Hero | null;
}

export const useHeroesStore = create<HeroesState>((set, get) => ({
    // Estado inicial - Heroes
    allHeroes: [],
    heroes: [],
    searchQuery: '',

    isLoading: false,
    error: null,

    fetchHeroes: async (game: Game = Game.MLBB) => {
        set({ isLoading: true, error: null });

        try {
            // JOIN con tablas intermedias
            const { data: heroesRaw, error: heroesError } = await supabase
                .from('heroes')
                .select(`
                    *,
                    heroe_lane(lane_id, lanes(*)),
                    heroe_rol(rol_id, roles(*))
                `)
                .eq('game', game);

            if (heroesError) throw heroesError;

            // Transformar la estructura anidada a nuestro formato Hero
            const heroes: Hero[] = (heroesRaw || []).map((hero: any) => ({
                id: hero.id,
                name: hero.name,
                game: hero.game,
                lanes: (hero.heroe_lane || [])
                    .map((hl: any) => hl.lanes)
                    .filter(Boolean) as Tag[],
                roles: (hero.heroe_rol || [])
                    .map((hr: any) => hr.roles)
                    .filter(Boolean) as Tag[],
                image_profile_url: hero.image_profile_url,
                image_slot_url: hero.image_slot_url
            }));

            set({
                allHeroes: heroes,
                heroes: heroes,
                isLoading: false
            });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Error al cargar datos',
                isLoading: false
            });
        }
    },

    setSearchQuery: (query: string) => {
        set({ searchQuery: query });
        get().filterHeroesByName(query);
    },

    filterHeroesByName: (query: string) => {
        const { allHeroes } = get();

        if (!query.trim()) {
            set({ heroes: allHeroes });
            return;
        }

        const normalizedQuery = query.toLowerCase().trim();
        const filtered = allHeroes.filter(hero =>
            hero.name?.toLowerCase().includes(normalizedQuery)
        );

        set({ heroes: filtered });
    },

    filterHeroesByLane: (laneId: number) => {
        const { allHeroes } = get();

        let filtered = allHeroes;

        if (laneId != 0) {
            filtered = allHeroes.filter(hero =>
                hero.lanes.some(lane => lane.id === laneId)
            );
        }

        set({
            heroes: filtered,
        });
    },

    findHeroById: (heroId?: number | null) => {
        if (!heroId) return null;
        const { allHeroes } = get();
        return allHeroes.find(hero => hero.id === heroId) || null;
    },
}));
