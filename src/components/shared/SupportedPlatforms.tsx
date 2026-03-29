import { Icon } from "@iconify/react";

export const SupportedPlatforms = () => {
    return (
        <div className="
            flex items-center 
            gap-2 px-3 py-2 
            bg-amber-950/20 text-amber-500/80
            border border-amber-900/40 
            rounded-lg 
        ">
            <Icon 
                icon="mdi:info-outline" 
                className="text-lg shrink-0" 
            />
            <span className="text-xs font-medium tracking-wide">
                Plataformas soportadas: <strong className="text-amber-400">Toornament</strong> y <strong className="text-amber-400">Battlefy</strong>
            </span>
        </div>
    );
}