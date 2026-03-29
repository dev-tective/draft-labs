import { Icon } from "@iconify/react";
import { useState } from "react";
import { Pick } from "../match-game.types";
import { ChangePlayerModal } from "./modal/ChangePlayerModal";
import { usePickAndBanStore } from "../store/pickAndBanStore";
import { useSortable } from "@dnd-kit/react/sortable";

export const PickSlot = ({ pick, index }: { pick: Pick, index: number }) => {
    const { ref, isDragging, handleRef } = useSortable({
        id: pick.id,
        data: { pick },
        index,
    });

    const [show, setShow] = useState(false);
    const [modalCoords, setModalCoords] = useState({ x: 0, y: 0 });

    const { hero, player, is_locked, is_active } = pick;
    const hasHero = !!hero?.image_profile_url;
    const lane = player?.lane;

    const { updatePick, loadingPickIds } = usePickAndBanStore();
    const isLoading = loadingPickIds.has(pick.id);

    const toggleLock = async () => {
        await updatePick(pick.id, { is_locked: !is_locked });
    }

    return (
        <div 
            ref={ref} 
            className={`
                flex relative border-r-3
                ${isDragging && 'opacity-50'}
                ${is_active ? 'border-amber-400 animate-pulse' : 'border-slate-600'}
            `}
        >

            {isLoading && (
                <div className={`
                    absolute inset-0 z-10
                    flex items-center justify-center 
                    bg-slate-900/60 backdrop-blur-sm
                    border border-amber-400/30
                    transition-all duration-500
                    animate-in fade-in
                `}>
                    <div className="flex flex-col items-center gap-2">
                        <div className="relative">
                            <Icon 
                                icon="line-md:loading-twotone-loop" 
                                className="
                                    text-amber-400 text-4xl 
                                    drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]
                                " 
                            />
                            <div className="absolute inset-0 bg-amber-400/20 blur-xl rounded-full animate-pulse" />
                        </div>
                    </div>
                </div>
            )}

            {show && <ChangePlayerModal
                pick={pick}
                coords={modalCoords}
                setShow={setShow}
            />}

            <button
                ref={handleRef}
                onClick={(e) => {
                    setModalCoords({ x: e.clientX, y: e.clientY });
                    setShow(true);
                }}
                className="
                    flex items-center justify-center
                    h-full px-2 text-xl font-bold
                    bg-amber-950/70 hover:bg-amber-400
                    transition-colors cursor-pointer
                    border border-amber-400/50 hover:text-amber-950
                "
            >
                <Icon icon="ic:sharp-swipe-vertical" />
            </button>

            <div className={`
                relative flex items-end justify-between
                w-full h-full p-3
                border border-slate-700/50 group
            `}>
                {/* Background Layer */}
                <div className={`
                    absolute inset-0 -z-1
                    flex items-center justify-center
                    overflow-hidden ${!hasHero && 'bg-slate-900'}
                `}>
                    {lane && (
                        <div
                            className={`
                                absolute aspect-square transition-all duration-500 ease-in-out
                                ${hasHero ?
                                    'top-3 left-3 h-1/7 bg-amber-400 drop-shadow' :
                                    'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-2/6 bg-slate-400/50'}
                            `}
                            style={{
                                maskImage: `url(${lane?.image})`,
                                maskSize: 'cover',
                                maskPosition: 'center',
                                maskRepeat: 'no-repeat',
                                WebkitMaskImage: `url(${lane?.image})`, // Compatibilidad para Safari
                            }}
                        />
                    )}
                    <div
                        className={`
                        absolute inset-0 -z-2
                        transition-all duration-700
                    `}
                        style={hasHero ? {
                            backgroundImage: `url(${hero.image_profile_url})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center 20%',
                            opacity: 0.6
                        } : {}}
                    />
                </div>

                <div className="
                    flex flex-col
                    text-xl uppercase font-bold drop-shadow
                ">
                    <span className="text-amber-400">{hero?.name ?? '??'}</span>
                    <span className="text-cyan-400">{player?.nickname}</span>
                </div>

                <div className="flex flex-col justify-between items-end h-full drop-shadow">
                    <IconSlot
                        icon="icon-park-outline:switch"
                        onClick={(e) => {
                            setModalCoords({ x: e.clientX, y: e.clientY });
                            setShow(true);
                        }}
                    />
                    <IconSlot
                        icon={!is_locked ? "oi:lock-unlocked" : "oi:lock-locked"}
                        onClick={toggleLock}
                    />
                </div>
            </div>
        </div>
    );
};

export const IconSlot = ({ icon, onClick }: { icon: string, onClick: (e: React.MouseEvent) => void }) => {
    return (
        <button
            onClick={onClick}
            className="
                flex items-center justify-center
                text-2xl text-slate-200 hover:text-amber-400
                transition-colors cursor-pointer font-bold
            "
        >
            <Icon icon={icon} />
        </button>
    );
}