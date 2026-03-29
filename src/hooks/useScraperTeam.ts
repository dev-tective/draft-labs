import { useState } from "react";
import { supabaseCloud } from "@/supabaseClient";

// Types para el team scraper
export interface ScrapedPlayer {
    uid?: string;
    nickname: string;
    is_active: boolean;
}

export interface ScrapedTeam {
    name: string;
    acronym: string;
    players: ScrapedPlayer[];
    logo_url: string;
}

// Función para mapear el objeto del scraper a nuestro formato
const mapScrapedTeamToTeamData = (scrapedTeam: ScrapedTeam): ScrapedTeam => {
    return {
        ...scrapedTeam,
        players: (scrapedTeam.players || []).map(p => ({
            ...p,
            uid: p.uid ?? crypto.randomUUID(),
        })),
    };
};

interface useScraperTeamState {
    loading: boolean;
    error: string | null;
}

export const useScraperTeam = () => {
    const [state, setState] = useState<useScraperTeamState>({
        loading: false,
        error: null,
    });

    const fetchTeam = async (url: string): Promise<ScrapedTeam> => {
        setState({ loading: true, error: null });

        try {
            const { data, error } = await supabaseCloud
                .functions
                .invoke<ScrapedTeam>('team-scraper', {
                    body: { url },
                });

            if (error || !data) throw error;

            console.log(data);

            setState({ loading: false, error: null });
            return mapScrapedTeamToTeamData(data);
        } catch (error: any) {
            setState({ loading: false, error: error.message });
            throw error;
        }
    };

    const fetchTournament = async (url: string): Promise<ScrapedTeam[]> => {
        setState({ loading: true, error: null });

        try {
            const { data, error } = await supabaseCloud
                .functions
                .invoke<ScrapedTeam[]>('tournament-scraper', {
                    body: { url },
                });

            if (error || !data) throw error;

            setState({ loading: false, error: null });
            return data.map(mapScrapedTeamToTeamData);
        } catch (error: any) {
            setState({ loading: false, error: error.message });
            throw error;
        }
    };

    return {
        ...state,
        fetchTeam,
        fetchTournament,
    };
};
