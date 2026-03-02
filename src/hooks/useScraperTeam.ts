import { supabase } from "@/supabaseClient";

// Types para el team scraper
export interface ScrapedPlayer {
    uid?: string;
    nickname: string;
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
        name: scrapedTeam.name,
        acronym: scrapedTeam.acronym,
        logo_url: scrapedTeam.logo_url,
        players: scrapedTeam.players.map(p => ({
            ...p,
            uid: p.uid ?? crypto.randomUUID(),
        })),
    };
};

export const useScraperTeam = async (link: string): Promise<ScrapedTeam> => {
    const { data, error } = await supabase.functions.invoke<ScrapedTeam>('team-scraper', {
        body: { teamUrl: link },
    });

    if (error) {
        throw new Error(error.message || 'Error al obtener datos del equipo');
    }

    if (!data) {
        throw new Error('No se recibieron datos del scraper');
    }

    console.table(data);

    return mapScrapedTeamToTeamData(data);
};
