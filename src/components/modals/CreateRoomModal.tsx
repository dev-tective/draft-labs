import { forwardRef, useState } from "react";
import { Icon } from "@iconify/react";
import { ModalLayout, ModalRef } from "@/layout/ModalLayout";
import { Option } from "@/components/Option";
import { RoomGame, useCreateRoom } from "@/hooks/useRoom";

interface SectionProps {
    title: string;
    icon: string;
    iconColor?: string;
    children: React.ReactNode;
}

const Section = ({ title, icon, iconColor = 'text-cyan-400', children }: SectionProps) => {
    const [show, setShow] = useState(true);

    return (
        <div className="space-y-4">
            <h2 className="
                flex items-center
                text-xs md:text-sm 
                text-slate-200 uppercase tracking-widest
            ">
                <Icon
                    icon={icon}
                    className={`text-lg md:text-2xl mr-3 ${iconColor}`}
                />
                {title}
                <Icon
                    icon={show ? 'ri:arrow-up-s-fill' : 'ri:arrow-down-s-fill'}
                    width="24"
                    height="24"
                    className="md:hidden"
                    onClick={() => setShow(!show)}
                />
            </h2>

            {show && children}
        </div >
    );
};

export const CreateRoomModal = forwardRef<ModalRef, {}>((_props, ref) => {
    const [selectedGame, setSelectedGame] = useState<RoomGame>(RoomGame.MLBB);
    const [bansPerTeam, setBansPerTeam] = useState<number>(5);
    const [isGlobalBan, setIsGlobalBan] = useState<boolean>(false);

    const bansValues = [0, 3, 5, 7];
    const bansIndex = bansValues.indexOf(bansPerTeam);

    const createRoom = useCreateRoom();

    const closeModal = () => {
        if (ref && typeof ref !== 'function' && ref.current) {
            ref.current.close();
        }
    };

    const handleSubmit = async () => {
        await createRoom.mutateAsync({
            game: selectedGame,
            bans_per_team: bansPerTeam,
            is_global_ban: isGlobalBan,
        });
        closeModal();
    };

    return (
        <ModalLayout ref={ref}>
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
                        <h1 className="text-xl md:text-2xl text-slate-200 uppercase tracking-widest font-bold italic">
                            Crear Sala
                        </h1>
                        <p className="text-cyan-500 text-xs md:text-sm tracking-wider uppercase">
                            Configura las especificaciones
                        </p>
                    </div>
                    <button
                        onClick={closeModal}
                        className="text-slate-500 hover:text-cyan-400 transition-colors"
                    >
                        <Icon icon="mdi:close" className="text-3xl" />
                    </button>
                </div>

                {/* Game Selection */}
                <Section
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
                </Section>

                {/* Bans Counter */}
                <Section
                    icon="ph:prohibit-inset-bold"
                    iconColor="text-fuchsia-500"
                    title="Bans por Equipo"
                >
                    <div className="flex md:flex-col items-center gap-6">
                        <div className="text-center">
                            <span className="text-2xl md:text-6xl font-bold text-fuchsia-500 tracking-wider">
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
                </Section>

                {/* Global Ban Toggle */}
                <Section
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
                </Section>

                {/* Submit Button */}
                <button
                    onClick={handleSubmit}
                    disabled={createRoom.isPending}
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
                    {createRoom.isPending && (
                        <Icon icon="line-md:loading-twotone-loop" className="text-2xl" />
                    )}
                    {createRoom.isPending ? 'Creando...' : 'Crear Sala'}
                </button>
            </div>
        </ModalLayout>
    );
});