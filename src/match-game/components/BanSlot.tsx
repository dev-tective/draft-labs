import { Icon } from "@iconify/react";
import { Ban } from "../match-game.types";
import { usePickAndBanStore } from "../store/pickAndBanStore";
import { IconSlot } from "./PickSlot";

export const BanSlot = ({ ban }: { ban: Ban }) => {
    const { hero, is_active, is_locked } = ban;
    const { loadingBanIds, updateBan } = usePickAndBanStore();
    const isLoading = loadingBanIds.has(ban.id);

    const toggleLock = () => {
        updateBan(ban.id, { is_locked: !is_locked });
    };

    return (
        <div
            className={`
                flex justify-end items-end
                w-full h-full 
                border p-2 relative
                ${!hero && 'bg-slate-900/50'}
                ${is_active ? 'border-amber-400 animate-pulse' : 'border-slate-600'}
            `}
            style={hero ? {
                backgroundImage: `url(${hero.image_slot_url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center 20%',
                opacity: 0.6
            } : {}}
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
            <IconSlot
                icon={!is_locked ? "oi:lock-unlocked" : "oi:lock-locked"}
                onClick={toggleLock}
            />
        </div>
    );
}