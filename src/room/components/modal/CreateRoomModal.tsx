import { forwardRef, useState } from "react";
import { Icon } from "@iconify/react";
import { ModalLayout, ModalRef } from "@/layout/ModalLayout";
import { Option } from "@/components/shared/Option";
import { useCreateRoom } from "@/room/hooks/useCreateRoom";
import { useScraperTeam, ScrapedTeam } from "@/hooks/useScraperTeam";
import { SupportedPlatforms } from "@/components/shared/SupportedPlatforms";
import { ModalSection } from "@/components/shared/ModalSection";
import { RoomGame } from "@/room/room.types";

export const CreateRoomModal = forwardRef<ModalRef, {}>((_props, ref) => {
    const [selectedGame, setSelectedGame] = useState<RoomGame>(RoomGame.MLBB);
    const [bansPerTeam, setBansPerTeam] = useState<number>(5);
    const [isGlobalBan, setIsGlobalBan] = useState<boolean>(false);
    const [tournamentUrl, setTournamentUrl] = useState('');
    const bansValues = [0, 3, 5, 7];
    const bansIndex = bansValues.indexOf(bansPerTeam);

    // Hooks
    const { loading: isScraping, error: scrapeError, fetchTournament } = useScraperTeam();
    const [scrapedTeams, setScrapedTeams] = useState<ScrapedTeam[] | null>(null);
    const {createRoom, loading }= useCreateRoom();

    const isLoading = isScraping || loading;

    const closeModal = () => {
        if (isLoading) return;
        if (ref && typeof ref !== 'function' && ref.current) {
            setTournamentUrl('');
            setScrapedTeams(null);
            ref.current.close();
        }
    };

    const handleScrape = async () => {
        if (!tournamentUrl.trim()) return;
        setScrapedTeams(null);
        const teams = await fetchTournament(tournamentUrl.trim());
        setScrapedTeams(teams);
    };

    const handleSubmit = async () => {
        await createRoom({
            game: selectedGame,
            bans_per_team: bansPerTeam,
            is_global_ban: isGlobalBan,
            teams: scrapedTeams ?? [],
        });
        closeModal();
    };

    return (
        <ModalLayout
            ref={ref}
            canClose={!isScraping}
        >
            <div className="
                absolute flex flex-col
                max-w-2xl w-10/12
                p-5 md:p-8 gap-6
                rounded-tr-3xl rounded-bl-3xl
                beveled-bl-tr border beveled
                bg-slate-950 border-cyan-800 
            ">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="
                            text-xl md:text-2xl text-slate-200 
                            uppercase tracking-widest font-bold italic
                        ">
                            Crear Sala
                        </h1>
                        <p className="
                            text-cyan-500 text-xs md:text-sm 
                            tracking-wider uppercase
                        ">
                            Configura las especificaciones
                        </p>
                    </div>
                    <button
                        onClick={closeModal}
                        disabled={isScraping}
                        className="
                            text-slate-500 hover:text-cyan-400 
                            transition-colors 
                            disabled:opacity-30 disabled:cursor-not-allowed
                        "
                    >
                        <Icon
                            icon="mdi:close"
                            className="text-3xl"
                        />
                    </button>
                </div>

                {/* Tournament URL Scraper */}
                <ModalSection
                    icon="mdi:tournament"
                    iconColor="text-amber-400"
                    title="Importar Equipos"
                >
                    <div className="space-y-3">
                        <SupportedPlatforms />
                        <div className="flex flex-col md:flex-row gap-2">
                            <input
                                type="url"
                                value={tournamentUrl}
                                onChange={(e) => {
                                    setTournamentUrl(e.target.value);
                                    // Reset teams when user changes URL
                                    if (scrapedTeams) {
                                        setScrapedTeams(null);
                                    }
                                }}
                                disabled={isScraping}
                                placeholder="https://play.toornament.com/..."
                                className="
                                    flex-1 bg-slate-900/60 border border-slate-700
                                    beveled-bl-tr rounded-tr-xl rounded-bl-xl
                                    px-4 py-2.5 text-sm text-slate-200
                                    placeholder:text-slate-600
                                    focus:outline-none focus:border-amber-400
                                    transition-colors
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                "
                            />
                            <button
                                onClick={handleScrape}
                                disabled={isScraping || !tournamentUrl.trim()}
                                className="
                                    max-w-56 px-4 py-2.5
                                    beveled-bl-tr
                                    border rounded-tr-xl rounded-bl-xl
                                    text-xs uppercase tracking-widest font-bold
                                    transition-all
                                    bg-amber-950/50 border-amber-500 text-amber-400
                                    hover:bg-amber-400 hover:text-slate-950
                                    disabled:opacity-40 disabled:cursor-not-allowed
                                    flex items-center gap-2 whitespace-nowrap
                                "
                            >
                                {isScraping
                                    ? <Icon icon="line-md:loading-twotone-loop" className="text-lg" />
                                    : <Icon icon="mdi:download" className="text-lg" />
                                }
                                {isScraping ? 'Extrayendo...' : 'Extraer'}
                            </button>
                        </div>

                        {/* Scrape result feedback */}
                        {scrapedTeams && (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-950/50 border border-emerald-600 text-emerald-400">
                                <Icon icon="mdi:check-circle" className="text-lg shrink-0" />
                                <span className="text-xs font-medium tracking-wide">
                                    {scrapedTeams.length} equipo{scrapedTeams.length !== 1 ? 's' : ''} encontrado{scrapedTeams.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                        )}

                        {scrapeError && (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-950/50 border border-red-600 text-red-400">
                                <Icon icon="mdi:alert-circle" className="text-lg shrink-0" />
                                <span className="text-xs font-medium tracking-wide truncate">
                                    {scrapeError}
                                </span>
                            </div>
                        )}

                        {isScraping && (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-950/30 border border-amber-700/50 text-amber-400/80">
                                <Icon icon="line-md:loading-twotone-loop" className="text-lg shrink-0" />
                                <span className="text-xs font-medium tracking-wide">
                                    Extrayendo equipos del torneo...
                                </span>
                            </div>
                        )}
                    </div>
                </ModalSection>

                {/* Game Selection */}
                <ModalSection
                    icon="ion:game-controller"
                    title="Seleccionar Juego"
                >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.values(RoomGame).map((game) => (
                            <Option
                                key={game}
                                option={game}
                                valueSelected={selectedGame}
                                value={game}
                                onClick={() => setSelectedGame(game)}
                            />
                        ))}
                    </div>
                </ModalSection>

                {/* Bans Counter */}
                <ModalSection
                    icon="ph:prohibit-inset-bold"
                    iconColor="text-fuchsia-500"
                    title="Bans por Equipo"
                >
                    <div className="flex flex-row-reverse items-center gap-6">
                        <div className="text-center">
                            <span className="text-2xl md:text-5xl font-bold text-fuchsia-500 tracking-wider">
                                {bansPerTeam}
                            </span>
                            <p className="text-slate-500 text-xs uppercase tracking-widest mt-2">
                                Bans
                            </p>
                        </div>

                        <div className="px-2 w-full">
                            <input
                                type="range"
                                min="0"
                                step="1"
                                max="3"
                                value={bansIndex}
                                onChange={(e) => setBansPerTeam(bansValues[Number(e.target.value)])}
                                className="
                                    w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer
                                    [&::-webkit-slider-thumb]:appearance-none
                                    [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6
                                    [&::-webkit-slider-thumb]:bg-fuchsia-500 [&::-webkit-slider-thumb]:rounded-full
                                    [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg
                                    [&::-webkit-slider-thumb]:shadow-fuchsia-500/50 [&::-webkit-slider-thumb]:hover:bg-fuchsia-400
                                    [&::-webkit-slider-thumb]:transition-all
                                    [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6
                                    [&::-moz-range-thumb]:bg-fuchsia-500 [&::-moz-range-thumb]:border-0
                                    [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer
                                    [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:shadow-fuchsia-500/50
                                    [&::-moz-range-thumb]:hover:bg-fuchsia-400 [&::-moz-range-thumb]:transition-all
                                "
                            />
                            <div className="flex justify-between mt-2 px-1">
                                {bansValues.map((val) => (
                                    <span
                                        key={val}
                                        className={`
                                            text-xs font-medium transition-all
                                            ${bansPerTeam === val
                                                ? 'text-fuchsia-500 text-base font-bold'
                                                : 'text-slate-500'
                                            }
                                        `}
                                    >
                                        {val}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </ModalSection>

                {/* Global Ban Toggle */}
                <ModalSection
                    icon="mdi:earth"
                    iconColor="text-cyan-500"
                    title="Ban Global"
                >
                    <button
                        onClick={() => setIsGlobalBan((prev) => !prev)}
                        className={`
                            flex items-center gap-3 w-full
                            px-4 py-3
                            border rounded-tr-xl rounded-bl-xl beveled-bl-tr
                            transition-all
                            ${isGlobalBan
                                ? 'bg-cyan-950/70 border-cyan-400 text-cyan-400'
                                : 'bg-slate-900/30 border-slate-700 text-slate-500'
                            }
                        `}
                    >
                        <Icon
                            icon={isGlobalBan ? "mdi:toggle-switch" : "mdi:toggle-switch-off"}
                            className="text-2xl"
                        />
                        <span className="text-xs uppercase tracking-widest font-bold">
                            {isGlobalBan ? "Activado" : "Desactivado"}
                        </span>
                    </button>
                </ModalSection>

                {/* Submit Button */}
                <button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="
                        w-full py-3 md:py-4
                        text-lg font-bold uppercase 
                        tracking-widest beveled-bl-tr
                        border rounded-tr-2xl rounded-bl-2xl
                        bg-cyan-950/70 border-cyan-400
                        transition-all
                        hover:bg-cyan-400 hover:text-slate-950
                        disabled:opacity-50 disabled:cursor-not-allowed
                        flex items-center justify-center gap-2
                    "
                >
                    {isLoading && (
                        <Icon icon="line-md:loading-twotone-loop" className="text-2xl" />
                    )}
                    {loading ?
                        'Creando...'
                        : isScraping ?
                            'Esperando extracción...'
                            : 'Crear Sala'}
                </button>
            </div>
        </ModalLayout>
    );
});