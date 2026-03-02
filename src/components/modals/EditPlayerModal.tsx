import { forwardRef, useState } from "react";
import { Icon } from "@iconify/react";
import { ModalLayout, ModalRef } from "../../layout/ModalLayout";
import { Player, usePlayerStore } from "@/stores/playerStore";
import { useMatchStore } from "@/stores/matchStore";
import { useTagsStore } from "@/stores/tagsStore";
import { Option } from "@/components/Option";
import DEFAULT_IMAGE from "@/assets/ui/silueta.png";

interface EditPlayerModalProps {
    player: Player;
    createMode?: boolean;
    teamId: string;
}

export const EditPlayerModal = forwardRef<ModalRef, EditPlayerModalProps>(({ player, createMode, teamId }, ref) => {
    const isDefaultInitial = !player.image_url || player.image_url === DEFAULT_IMAGE;

    const [formData, setFormData] = useState({
        nickname: player.nickname,
        imageUrl: isDefaultInitial ? '' : player.image_url,
        laneId: player.lane?.id ?? 0,
        useCustomImage: !isDefaultInitial
    });

    const { currentMatch } = useMatchStore();
    const { createPlayer, updatePlayer } = usePlayerStore();

    const { lanes, findLane } = useTagsStore();

    const handleSubmit = async () => {
        if (!formData.nickname.trim()) return;

        const commonData = {
            nickname: formData.nickname.trim(),
            image_url: (formData.useCustomImage && formData.imageUrl?.trim()) ? formData.imageUrl.trim() : DEFAULT_IMAGE,
            lane: findLane(formData.laneId),
        };

        if (createMode) {
            await createPlayer({
                ...commonData,
                team_id: teamId,
                match_id: currentMatch?.id ?? '',
            });
        } else {
            await updatePlayer({ ...commonData, id: player.id });
        }

        if (ref && typeof ref !== 'function' && ref.current) {
            ref.current.close();
        }
    };

    const handleRestoreDefault = () => {
        setFormData(prev => ({ ...prev, useCustomImage: false, imageUrl: '' }));
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
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl md:text-2xl text-slate-200 uppercase tracking-widest font-bold italic">
                            {createMode ? 'Create Player' : 'Edit Player'}
                        </h1>
                        <p className="text-cyan-500 text-xs md:text-sm tracking-wider uppercase">
                            {createMode ? 'Add new player to team' : 'Modify player information'}
                        </p>
                    </div>
                    <button
                        onClick={() => ref && typeof ref !== 'function' && ref.current?.close()}
                        className="text-slate-500 hover:text-cyan-400 transition-colors"
                    >
                        <Icon icon="mdi:close" className="text-3xl" />
                    </button>
                </div>

                {/* Nickname Field */}
                <div className="space-y-4">
                    <h2 className="
                        flex items-center
                        text-xs md:text-sm 
                        text-slate-200 uppercase tracking-widest
                    ">
                        <Icon
                            icon="mdi:account"
                            className="text-lg md:text-2xl mr-3 text-cyan-400"
                        />
                        Nickname
                    </h2>
                    <input
                        type="text"
                        value={formData.nickname}
                        onChange={(e) => setFormData(prev => ({ ...prev, nickname: e.target.value }))}
                        placeholder="Enter player nickname"
                        className="
                            w-full
                            px-4 py-3
                            bg-slate-900/50
                            border border-slate-700
                            rounded-tr-xl rounded-bl-xl
                            beveled-bl-tr
                            text-slate-200
                            placeholder:text-slate-600
                            focus:outline-none
                            focus:border-cyan-500
                            transition-colors
                        "
                    />
                </div>

                {/* Nickname Field */}
                <div className="space-y-4">
                    <h2 className="
                        flex items-center
                        text-xs md:text-sm 
                        text-slate-200 uppercase tracking-widest
                    ">
                        <Icon
                            icon="game-icons:battle-gear"
                            className="text-lg md:text-2xl mr-3 text-cyan-400"
                        />
                        Lane
                    </h2>
                    <div className="grid grid-cols-3 gap-2">
                        {lanes.map((lane) => (
                            <Option
                                key={lane.id}
                                option={lane.name}
                                valueSelected={formData.laneId}
                                value={lane.id}
                                onClick={() => {
                                    setFormData(prev => ({ ...prev, laneId: lane.id }));
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* Image URL Field */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="
                            flex items-center
                            text-xs md:text-sm 
                            text-slate-200 uppercase tracking-widest
                        ">
                            <Icon
                                icon="mdi:image"
                                className="text-lg md:text-2xl mr-3 text-fuchsia-500"
                            />
                            Image
                        </h2>
                        {formData.useCustomImage ? (
                            <button
                                onClick={handleRestoreDefault}
                                className="
                                    text-xs text-fuchsia-400 hover:text-fuchsia-300
                                    uppercase tracking-wider font-semibold
                                    flex items-center gap-1
                                    transition-colors
                                "
                            >
                                <Icon icon="mdi:restore" className="text-base" />
                                Restore Default
                            </button>
                        ) : (
                            <button
                                onClick={() => setFormData(prev => ({ ...prev, useCustomImage: true }))}
                                className="
                                    text-xs text-cyan-400 hover:text-cyan-300
                                    uppercase tracking-wider font-semibold
                                    flex items-center gap-1
                                    transition-colors
                                "
                            >
                                <Icon icon="mdi:pencil" className="text-base" />
                                Use Custom URL
                            </button>
                        )}
                    </div>

                    {formData.useCustomImage ? (
                        <input
                            type="text"
                            value={formData.imageUrl}
                            onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                            placeholder="https://example.com/image.jpg"
                            className="
                                w-full
                                px-4 py-3
                                bg-slate-900/50
                                border border-slate-700
                                rounded-tr-xl rounded-bl-xl
                                beveled-bl-tr
                                text-slate-200
                                placeholder:text-slate-600
                                focus:outline-none
                                focus:border-fuchsia-500
                                transition-colors
                            "
                        />
                    ) : (
                        <div className="
                            w-full px-4 py-3
                            bg-slate-900/30
                            border border-slate-800
                            rounded-tr-xl rounded-bl-xl
                            text-slate-500 italic text-sm
                        ">
                            Using default image
                        </div>
                    )}

                    {/* Image Preview */}
                    <div className="mt-4">
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                            Preview
                        </p>
                        <div className="w-24 h-24 overflow-hidden rounded-lg border border-slate-700 bg-slate-800">
                            <img
                                src={formData.useCustomImage && formData.imageUrl ? formData.imageUrl : DEFAULT_IMAGE}
                                alt="Preview"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    // Fallback to default if custom fails, or keep visible if default fails (unlikely)
                                    if (e.currentTarget.src !== DEFAULT_IMAGE) {
                                        e.currentTarget.src = DEFAULT_IMAGE;
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    onClick={handleSubmit}
                    disabled={!formData.nickname.trim()}
                    className={`
                        w-full py-3 md:py-4
                        text-lg font-bold uppercase 
                        tracking-widest beveled-bl-tr
                        border rounded-tr-2xl rounded-bl-2xl
                        bg-cyan-900/20 border-cyan-600 text-cyan-400
                        transition-all
                        hover:bg-cyan-900/30 hover:border-cyan-400
                        disabled:opacity-50 disabled:cursor-not-allowed
                        flex items-center justify-center gap-2
                    `}
                >
                    {createMode ? 'Create Player' : 'Save Changes'}
                </button>
            </div>
        </ModalLayout>
    );
});