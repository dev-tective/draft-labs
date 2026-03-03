import { forwardRef, useState } from "react";
import { Icon } from "@iconify/react";
import { ModalLayout, ModalRef } from "@/layout/ModalLayout";
import { Game, useMatchStore } from "@/stores/matchStore";
import { Option } from "@/components/Option";

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

export const CreateMatchModal = forwardRef<ModalRef, {}>((_props, ref) => {
    const [selectedGame, setSelectedGame] = useState<Game>(Game.MLBB);
    const [bestOf, setBestOf] = useState<number>(3);
    const [bansPerTeam, setBansPerTeam] = useState<number>(3);

    // Allowed bans values
    const bansValues = [0, 3, 5, 7];
    const bansIndex = bansValues.indexOf(bansPerTeam);

    const { createMatch, loading } = useMatchStore();

    const handleSubmit = async () => {
        if (!selectedGame) return;

        await createMatch({
            best_of: bestOf,
            bans_per_team: bansPerTeam,
            game: selectedGame,
        });

        // createMatch → subscribeToMatch se activa automáticamente dentro del store
        if (ref && typeof ref !== 'function' && ref.current) {
            ref.current.close();
        }
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
                            Create Match
                        </h1>
                        <p className="text-cyan-500 text-xs md:text-sm tracking-wider uppercase">
                            Configure specifications
                        </p>
                    </div>
                    <button
                        onClick={() => ref && typeof ref !== 'function' && ref.current?.close()}
                        className="text-slate-500 hover:text-cyan-400 transition-colors"
                    >
                        <Icon icon="mdi:close" className="text-3xl" />
                    </button>
                </div>

                {/* Game Selection */}
                <Section
                    icon="ion:game-controller"
                    title="Select Game"
                >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.values(Game).map((game) => (
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

                {/* Best Of Selection */}
                <Section
                    icon="ri:sword-fill"
                    iconColor="text-fuchsia-500"
                    title="Match Format"
                >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Array.from([1, 3, 5, 7]).map((bo) => (
                            <Option
                                key={bo}
                                option={`BO${bo}`}
                                valueSelected={bestOf}
                                value={bo}
                                onClick={() => setBestOf(bo)}
                            />
                        ))}
                    </div>
                </Section>

                {/* Bans Counter */}
                <Section
                    icon="ph:prohibit-inset-bold"
                    iconColor="text-fuchsia-500"
                    title="Bans per Team"
                >
                    <div className="
                        flex md:flex-col items-center
                        gap-6
                    ">
                        {/* Current Value Display */}
                        <div className="text-center">
                            <span className="text-2xl md:text-6xl font-bold text-fuchsia-500 tracking-wider">
                                {bansPerTeam}
                            </span>
                            <p className="text-slate-500 text-xs uppercase tracking-widest mt-2">
                                Bans
                            </p>
                        </div>

                        {/* Range Slider */}
                        <div className="px-2 w-full">
                            <input
                                type="range"
                                min="0"
                                step="1"
                                max="3"
                                value={bansIndex}
                                onChange={(e) => setBansPerTeam(bansValues[Number(e.target.value)])}
                                className="
                                    w-full h-2 
                                    bg-slate-800 
                                    rounded-lg 
                                    appearance-none cursor-pointer
                                    [&::-webkit-slider-thumb]:appearance-none
                                    [&::-webkit-slider-thumb]:w-6
                                    [&::-webkit-slider-thumb]:h-6
                                    [&::-webkit-slider-thumb]:bg-fuchsia-500
                                    [&::-webkit-slider-thumb]:rounded-full
                                    [&::-webkit-slider-thumb]:cursor-pointer
                                    [&::-webkit-slider-thumb]:shadow-lg
                                    [&::-webkit-slider-thumb]:shadow-fuchsia-500/50
                                    [&::-webkit-slider-thumb]:hover:bg-fuchsia-400
                                    [&::-webkit-slider-thumb]:transition-all
                                    [&::-moz-range-thumb]:w-6
                                    [&::-moz-range-thumb]:h-6
                                    [&::-moz-range-thumb]:bg-fuchsia-500
                                    [&::-moz-range-thumb]:border-0
                                    [&::-moz-range-thumb]:rounded-full
                                    [&::-moz-range-thumb]:cursor-pointer
                                    [&::-moz-range-thumb]:shadow-lg
                                    [&::-moz-range-thumb]:shadow-fuchsia-500/50
                                    [&::-moz-range-thumb]:hover:bg-fuchsia-400
                                    [&::-moz-range-thumb]:transition-all
                                "
                            />
                            {/* Number Labels */}
                            <div className="flex justify-between mt-2 px-1">
                                {Array.from([0, 3, 5, 7], (_) => (
                                    <span
                                        key={_}
                                        className={`
                                            text-xs font-medium transition-all
                                            ${bansPerTeam === _ ?
                                                'text-fuchsia-500 text-base font-bold' :
                                                'text-slate-500'
                                            }
                                        `}
                                    >
                                        {_}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </Section>

                {/* Submit Button */}
                <button
                    onClick={handleSubmit}
                    disabled={!selectedGame || loading}
                    className={`
                        w-full py-3 md:py-4
                        text-lg font-bold uppercase 
                        tracking-widest beveled-bl-tr
                        border rounded-tr-2xl rounded-bl-2xl
                        bg-cyan-950/70 border-cyan-400
                        transition-all
                        hover:bg-cyan-400 hover:text-slate-950
                        disabled:opacity-50 disabled:cursor-not-allowed
                        flex items-center justify-center gap-2
                    `}
                >
                    {loading && (
                        <Icon
                            icon="line-md:loading-twotone-loop"
                            className="text-2xl"
                        />
                    )}
                    {loading ? 'Creating...' : 'Create'}
                </button>
            </div>
        </ModalLayout>
    );
});