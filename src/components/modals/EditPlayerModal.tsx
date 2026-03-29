import { forwardRef, useState } from "react";
import { Icon } from "@iconify/react";
import { ModalLayout, ModalRef } from "../../layout/ModalLayout";
import { Player, useTeamStore } from "@/stores/teamStore";
import { useTagStore } from "@/stores/tagStore";
import { Option } from "@/components/shared/Option";
import DEFAULT_IMAGE from "@/assets/ui/silueta.png";

import { ModalSection } from "../shared/ModalSection";

interface EditPlayerModalProps {
    player: Player;
    createMode?: boolean;
}

export const EditPlayerModal = forwardRef<ModalRef, EditPlayerModalProps>(({ player, createMode }, ref) => {
    const isDefaultInitial = !player.profile_url || player.profile_url === DEFAULT_IMAGE;

    const [formData, setFormData] = useState({
        nickname: player.nickname,
        imageUrl: isDefaultInitial ? '' : player.profile_url,
        lane: player.lane,
        useCustomImage: !isDefaultInitial
    });

    const { createPlayer, updatePlayer, loadingTeamIds } = useTeamStore();
    const updateTeamLoading = loadingTeamIds.has(player.team_id);


    const { lanes, findLane } = useTagStore();

    const isLoading = updateTeamLoading;

    const handleSubmit = async () => {
        if (!formData.nickname.trim()) return;

        const commonData = {
            nickname: formData.nickname.trim(),
            profile_url: (formData.useCustomImage && formData.imageUrl?.trim()) ? formData.imageUrl.trim() : null,
            lane: findLane(formData.lane?.id ?? 0) ?? undefined,
        };

        if (createMode) {
            await createPlayer({
                ...commonData,
                team_id: player.team_id,
                room_id: player.room_id,
            });
        } else {
            await updatePlayer({ 
                ...commonData, 
                id: player.id, 
                team_id: player.team_id 
            });
        }

        if (ref && typeof ref !== 'function' && ref.current) {
            ref.current.close();
            setFormData({
                nickname: player.nickname,
                imageUrl: isDefaultInitial ? '' : player.profile_url,
                lane: player.lane,
                useCustomImage: !isDefaultInitial
            });
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
                            {createMode ? 'Crear Jugador' : 'Editar Jugador'}
                        </h1>
                        <p className="text-cyan-500 text-xs md:text-sm tracking-wider uppercase">
                            {createMode ? 'Añade un nuevo jugador al equipo' : 'Modifica la información del jugador'}
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

                {/* Nickname Field */}
                <ModalSection
                    title="Nickname"
                    icon="mdi:account"
                >
                    <input
                        type="text"
                        value={formData.nickname}
                        onChange={(e) => setFormData(prev => ({ ...prev, nickname: e.target.value }))}
                        placeholder="Introduce el nickname del jugador"
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
                </ModalSection>

                {/* Lane Field */}
                <ModalSection
                    title="Línea / Rol"
                    icon="game-icons:battle-gear"
                >
                    <div className="grid grid-cols-3 gap-2">
                        {lanes.map((lane) => (
                            <Option
                                key={lane.id}
                                option={lane.name}
                                valueSelected={formData.lane?.id ?? 0}
                                value={lane.id}
                                onClick={() => {
                                    setFormData(prev => ({ ...prev, lane: lane }));
                                }}
                            />
                        ))}
                    </div>
                </ModalSection>

                {/* Image URL Field */}
                <ModalSection
                    title="Imagen del Jugador"
                    icon="mdi:image"
                    iconColor="text-fuchsia-500"
                >
                    <div className="space-y-4">
                        <div className="flex items-center justify-end">
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
                                    Restaurar por Defecto
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
                                    Usar URL Personalizada
                                </button>
                            )}
                        </div>

                        {formData.useCustomImage ? (
                            <input
                                type="text"
                                value={formData.imageUrl ?? ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                                placeholder="https://ejemplo.com/imagen.jpg"
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
                                Usando imagen por defecto
                            </div>
                        )}

                        {/* Image Preview */}
                        <div className="mt-4">
                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                                Vista Previa
                            </p>
                            <div className="w-24 h-24 overflow-hidden rounded-lg border border-slate-700 bg-slate-800">
                                <img
                                    src={formData.useCustomImage && formData.imageUrl ? formData.imageUrl : DEFAULT_IMAGE}
                                    alt="Vista Previa"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        if (e.currentTarget.src !== DEFAULT_IMAGE) {
                                            e.currentTarget.src = DEFAULT_IMAGE;
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </ModalSection>

                {/* Submit Button */}
                <button
                    onClick={handleSubmit}
                    disabled={!formData.nickname.trim() || isLoading}
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
                    {isLoading ? (
                        <>
                            <Icon icon="line-md:loading-twotone-loop" className="text-xl" />
                            {createMode ? 'Creando...' : 'Guardando...'}
                        </>
                    ) : (
                        createMode ? 'Crear Jugador' : 'Guardar Cambios'
                    )}
                </button>
            </div>
        </ModalLayout>
    );
});