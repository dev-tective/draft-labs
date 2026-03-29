import { forwardRef, useState } from "react";
import { Icon } from "@iconify/react";
import { ModalLayout, ModalRef } from "@/layout/ModalLayout";
import { useScraperTeam, ScrapedTeam } from "@/hooks/useScraperTeam";
import { useCreateTeam } from "@/hooks/useTeam";
import { SupportedPlatforms } from "@/components/shared/SupportedPlatforms";
import { ModalSection } from "@/components/shared/ModalSection";

export const CreateTeamModal = forwardRef<ModalRef, { roomId: string }>(({ roomId }, ref) => {
    const [teamUrl, setTeamUrl] = useState("");
    const [scrapedTeam, setScrapedTeam] = useState<ScrapedTeam>({
        name: "",
        acronym: "",
        logo_url: "",
        players: []
    });

    // Scraper hook
    const { loading: isScraping, error: scrapeError, fetchTeam } = useScraperTeam();

    // Hook for creating team
    const { createTeam, loading } = useCreateTeam();

    const isLoading = isScraping || loading;

    const handleScrape = async () => {
        if (!teamUrl.trim()) return;
        const data = await fetchTeam(teamUrl.trim());
        setScrapedTeam(data);
    };

    // Métodos para actualizar datos específicos de scrapedTeam
    const updatePlayerNickname = (index: number, newNickname: string) => {
        const updatedPlayers = [...scrapedTeam.players];
        updatedPlayers[index] = { ...updatedPlayers[index], nickname: newNickname };

        setScrapedTeam({
            ...scrapedTeam,
            players: updatedPlayers
        });
    };

    const updateTeamName = (newName: string) => {
        setScrapedTeam({ ...scrapedTeam, name: newName });
    };

    const updateTeamAcronym = (newAcronym: string) => {
        setScrapedTeam({ ...scrapedTeam, acronym: newAcronym });
    };

    const addPlayer = () => {
        setScrapedTeam({
            ...scrapedTeam,
            players: [{ uid: crypto.randomUUID(), nickname: "", is_active: false }, ...scrapedTeam.players]
        });
    };

    const removePlayer = (index: number) => {
        const updatedPlayers = scrapedTeam.players.filter((_, i) => i !== index);
        setScrapedTeam({
            ...scrapedTeam,
            players: updatedPlayers
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleScrape();
        }
    };

    const handleCreateTeam = async () => {
        if (!scrapedTeam.name.trim()) return;

        // Format players data - filter out empty nicknames
        const formattedPlayers = scrapedTeam.players
            .filter(p => p.nickname.trim())
            .map(p => ({ nickname: p.nickname.trim(), is_active: p.is_active }));

        await createTeam(
            {
                room_id: roomId ?? '',
                name: scrapedTeam.name.trim(),
                acronym: scrapedTeam.acronym.trim(),
                logo_url: scrapedTeam.logo_url || undefined,
            },
            formattedPlayers.length > 0 ? formattedPlayers : undefined
        );

        // Reset form and close modal
        ref && typeof ref !== 'function' && ref.current?.close();
        setTeamUrl("");
        setScrapedTeam({ name: "", acronym: "", logo_url: "", players: [] });
    };

    return (
        <ModalLayout ref={ref} canClose={!loading && !isScraping}>
            <div className="
                absolute flex flex-col
                max-w-2xl w-10/12
                p-5 md:p-8 gap-6
                rounded-tr-3xl rounded-bl-3xl
                beveled-bl-tr border beveled
                bg-slate-950 border-cyan-800 
                max-h-[90vh] overflow-y-auto
            ">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl md:text-2xl text-slate-200 uppercase tracking-widest font-bold italic">
                            Crear Equipo
                        </h1>
                        <p className="text-cyan-500 text-xs md:text-sm tracking-wider uppercase">
                            Introduce la URL del equipo
                        </p>
                    </div>
                    <button
                        onClick={() => ref && typeof ref !== 'function' && ref.current?.close()}
                        disabled={isLoading}
                        className="text-slate-500 hover:text-cyan-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <Icon icon="mdi:close" className="text-3xl" />
                    </button>
                </div>

                {/* URL Input Section */}
                <ModalSection
                    icon="mdi:link-variant"
                    iconColor="text-amber-400"
                    title="URL del Equipo"
                >
                    <div className="space-y-3">
                        <SupportedPlatforms />
                        <div className="flex flex-col md:flex-row gap-3">
                            <input
                                type="url"
                                value={teamUrl}
                                onChange={(e) => setTeamUrl(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={isLoading}
                                placeholder="https://battlefy.com/..."
                                className="
                                    flex-1
                                    px-4 py-3
                                    bg-slate-900/50
                                    border border-slate-700
                                    rounded-tr-xl rounded-bl-xl
                                    beveled-bl-tr
                                    text-slate-200
                                    placeholder:text-slate-600
                                    focus:outline-none
                                    focus:border-amber-400
                                    transition-colors
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                "
                            />
                            <button
                                onClick={handleScrape}
                                disabled={!teamUrl.trim() || isLoading}
                                className="
                                    px-6 py-3
                                    text-sm font-bold uppercase 
                                    tracking-widest beveled-bl-tr
                                    border rounded-tr-xl rounded-bl-xl
                                    bg-amber-950/50 border-amber-400 text-amber-400
                                    transition-all
                                    hover:bg-amber-400 hover:text-slate-950
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                    flex items-center justify-center gap-2
                                "
                            >
                                {isScraping ? (
                                    <Icon
                                        icon="line-md:loading-twotone-loop"
                                        className="text-xl"
                                    />
                                ) : (
                                    <Icon icon="mdi:download" className="text-xl" />
                                )}
                                {isScraping ? 'Obteniendo...' : 'Extraer Datos'}
                            </button>
                        </div>
                        {scrapeError && (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-950/50 border border-red-600 text-red-400 mt-3">
                                <Icon icon="mdi:alert-circle" className="text-lg shrink-0" />
                                <span className="text-xs font-medium tracking-wide truncate">
                                    {scrapeError}
                                </span>
                            </div>
                        )}
                    </div>
                </ModalSection>

                <ModalSection
                    icon="ri:edit-fill"
                    title="Editar Equipo"
                >
                    <div className="
                            p-5
                            bg-slate-900/30
                            border border-slate-700
                            rounded-tr-xl rounded-bl-xl
                            beveled-bl-tr
                            space-y-4
                        ">
                        {/* Team Info */}
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-slate-800 rounded-lg overflow-hidden shrink-0">
                                {scrapedTeam.logo_url ? (
                                    <img
                                        src={scrapedTeam.logo_url}
                                        alt={scrapedTeam.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Icon icon="mdi:shield" className="text-3xl text-slate-600" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 space-y-2">
                                <input
                                    type="text"
                                    value={scrapedTeam.name}
                                    onChange={(e) => updateTeamName(e.target.value)}
                                    placeholder="Nombre"
                                    className="
                                        w-full
                                        text-xl font-bold text-cyan-400
                                        bg-transparent
                                        border border-transparent
                                        rounded px-2 py-1
                                        focus:outline-none
                                        focus:border-cyan-500
                                        focus:bg-slate-800/50
                                        placeholder:text-slate-500
                                        placeholder:font-normal
                                        transition-colors
                                    "
                                />
                                <input
                                    type="text"
                                    value={scrapedTeam.acronym}
                                    onChange={(e) => updateTeamAcronym(e.target.value)}
                                    placeholder="Siglas"
                                    className="
                                        w-full
                                        text-sm text-slate-400 uppercase tracking-wider
                                        bg-transparent
                                        border border-transparent
                                        rounded px-2 py-1
                                        focus:outline-none
                                        focus:border-cyan-500
                                        focus:bg-slate-800/50
                                        transition-colors
                                    "
                                />
                            </div>
                        </div>

                        {/* Players List */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs text-slate-500 uppercase tracking-wider">
                                    Jugadores ({scrapedTeam.players.length})
                                </h4>
                                <button
                                    onClick={addPlayer}
                                    className="
                                        flex items-center gap-1.5
                                        px-3 py-1
                                        bg-slate-800/30
                                        border border-dashed border-slate-600
                                        hover:border-fuchsia-500 hover:bg-slate-800/50
                                        rounded-lg
                                        text-slate-500 hover:text-fuchsia-400
                                        text-xs uppercase tracking-wider
                                        transition-all
                                    "
                                >
                                    <Icon icon="mdi:plus" width={14} height={14} />
                                    Añadir jugador
                                </button>
                            </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {scrapedTeam.players.map((player, index) => (
                                        <PlayerInput
                                            key={index}
                                            nickname={player.nickname}
                                            index={index}
                                            updatePlayerNickname={updatePlayerNickname}
                                            removePlayer={removePlayer}
                                        />
                                    ))}
                                </div>
                        </div>
                    </div>
                </ModalSection>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={() => {
                            setTeamUrl("");
                            setScrapedTeam({
                                name: "",
                                acronym: "",
                                logo_url: "",
                                players: []
                            });
                        }}
                        className="
                            flex-1 py-3
                            text-sm font-bold uppercase 
                            tracking-widest beveled-bl-tr
                            border rounded-tr-xl rounded-bl-xl
                            bg-slate-900/50 border-slate-700 text-slate-400
                            transition-all
                            hover:bg-slate-800 hover:border-slate-600
                        "
                    >
                        Limpiar
                    </button>
                    <button
                        onClick={handleCreateTeam}
                        disabled={!scrapedTeam.name.trim() || isLoading}
                        className="
                            flex-1 py-3
                            text-sm font-bold uppercase 
                            tracking-widest beveled-bl-tr
                            border rounded-tr-xl rounded-bl-xl
                            bg-cyan-950/70 border-cyan-400 text-cyan-400
                            transition-all
                            hover:bg-cyan-400 hover:text-slate-950
                            disabled:opacity-50 disabled:cursor-not-allowed
                            flex items-center justify-center gap-2
                        "
                    >
                        Crear Equipo
                    </button>
                </div>
            </div>
        </ModalLayout>
    );
});

interface PlayerInputProps {
    nickname: string;
    index: number;
    updatePlayerNickname: (index: number, nickname: string) => void;
    removePlayer: (index: number) => void;
}

const PlayerInput = ({
    nickname,
    index,
    updatePlayerNickname,
    removePlayer
}: PlayerInputProps) => {
    return (
        <div
            className="
                relative group
                flex items-center gap-2
                w-full px-3 py-2
                bg-slate-800/50 border border-slate-700
                rounded-lg
                transition-colors
                hover:border-fuchsia-500
            "
        >
            <input
                type="text"
                value={nickname}
                onChange={(e) => updatePlayerNickname(index, e.target.value)}
                placeholder="Nickname"
                className="
                    flex-1 min-w-0
                    bg-transparent
                    text-sm text-slate-300
                    tracking-wider
                    placeholder:text-slate-600
                    focus:outline-none
                "
            />

            <button
                onClick={() => removePlayer(index)}
                className="
                    shrink-0
                    w-5 h-5
                    rounded-full
                    flex items-center justify-center
                    opacity-0 group-hover:opacity-100
                    transition-opacity
                    text-fuchsia-500
                "
                title="Eliminar jugador"
            >
                <Icon
                    icon="mdi:close"
                    width={20}
                    height={20}
                />
            </button>
        </div>
    );
};