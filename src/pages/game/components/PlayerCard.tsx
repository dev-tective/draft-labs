import { Player } from "@/stores/playerStore";

interface Props {
    player: Player;
}

export const PlayerCard = ({ player }: Props) => {
    const { nickname, lane } = player;

    return (
        <div className="
            flex flex-col items-center
            flex-1 gap-1 p-1
            border border-slate-700 rounded-lg
            bg-slate-700
        ">
            <div className="w-8 h-8 flex items-center justify-center overflow-hidden">
                <div className={`mx-auto h-full aspect-square scale-75 bg-slate-300`}
                    style={{
                        maskImage: `url(${lane?.image || 'no.svg'})`,
                        maskSize: 'cover',
                        maskPosition: 'center',
                        maskRepeat: 'no-repeat',
                    }}
                />
            </div>
            <div className="w-full text-center truncate text-xs text-slate-300">
                {nickname}
            </div>
        </div>
    );
};