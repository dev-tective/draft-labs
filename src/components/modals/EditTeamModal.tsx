import { forwardRef, useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { ModalLayout, ModalRef } from "@/layout/ModalLayout";
import { Team } from "@/stores/teamStore";
import { useUpdateTeam } from "@/hooks/useTeam";
import SHIELD from "@/assets/ui/shield.svg";
import { ModalSection } from "@/components/shared/ModalSection";

interface EditTeamModalProps {
    team: Team;
}

const isDefaultLogo = (url?: string | null) => !url || url === SHIELD;

const buildForm = (t: Team) => ({
    name: t.name,
    acronym: t.acronym,
    coach: t.coach || '',
    logoUrl: isDefaultLogo(t.logo_url) ? '' : (t.logo_url ?? ''),
    useCustomLogo: !isDefaultLogo(t.logo_url),
});

export const EditTeamModal = forwardRef<ModalRef, EditTeamModalProps>(({ team }, ref) => {
    const [form, setForm] = useState(() => buildForm(team));
    const { name, acronym, coach, logoUrl, useCustomLogo } = form;

    // Reset state when team changes
    useEffect(() => {
        setForm(buildForm(team));
    }, [team]);

    const { updateTeam, loading: updateLoading } = useUpdateTeam();

    const handleSubmit = async () => {
        if (!name.trim()) return;

        await updateTeam({
            id: team.id,
            name: name.trim(),
            acronym: acronym?.trim(),
            coach: coach.trim() || undefined,
            logo_url: (useCustomLogo && logoUrl?.trim()) ? logoUrl.trim() : undefined,
        });

        if (ref && typeof ref !== 'function' && ref.current) {
            ref.current.close();
        }
    };

    const handleRestoreDefault = () => {
        setForm(prev => ({ ...prev, useCustomLogo: false, logoUrl: '' }));
    };

    return (
        <ModalLayout ref={ref} canClose={!updateLoading}>
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
                            Editar Equipo
                        </h1>
                        <p className="text-cyan-500 text-xs md:text-sm tracking-wider uppercase">
                            Modifica la información del equipo
                        </p>
                    </div>
                    <button
                        onClick={() => ref && typeof ref !== 'function' && ref.current?.close()}
                        disabled={updateLoading}
                        className="text-slate-500 hover:text-cyan-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <Icon icon="mdi:close" className="text-3xl" />
                    </button>
                </div>

                {/* Name Field */}
                <ModalSection
                    title="Nombre del Equipo"
                    icon="ri:team-fill"
                >
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Introduce el nombre del equipo"
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

                {/* Acronym Field */}
                <ModalSection
                    title="Siglas del Equipo"
                    icon="mdi:format-letter-case"
                >
                    <input
                        type="text"
                        value={acronym}
                        onChange={(e) => setForm(prev => ({ ...prev, acronym: e.target.value }))}
                        placeholder="Siglas (máx. 5)"
                        maxLength={5}
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

                {/* Coach Field */}
                <ModalSection
                    title="Entrenador (Coach)"
                    icon="mdi:account-tie"
                >
                    <input
                        type="text"
                        value={coach}
                        onChange={(e) => setForm(prev => ({ ...prev, coach: e.target.value }))}
                        placeholder="Nombre del entrenador"
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

                {/* Logo URL Field */}
                <ModalSection
                    title="Logo del Equipo"
                    icon="mdi:image"
                    iconColor="text-fuchsia-500"
                >
                    <div className="space-y-4">
                        <div className="flex items-center justify-end">
                            {useCustomLogo ? (
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
                                    onClick={() => setForm(prev => ({ ...prev, useCustomLogo: true }))}
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

                        {useCustomLogo ? (
                            <input
                                type="text"
                                value={logoUrl}
                                onChange={(e) => setForm(prev => ({ ...prev, logoUrl: e.target.value }))}
                                placeholder="https://ejemplo.com/logo.png"
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
                                Usando logo por defecto
                            </div>
                        )}

                        {/* Image Preview */}
                        <div className="mt-4">
                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                                Vista Previa
                            </p>
                            <img
                                src={useCustomLogo && logoUrl ? logoUrl : SHIELD}
                                alt="Vista Previa"
                                className="w-24 h-24 object-contain rounded-lg"
                            />
                        </div>
                    </div>
                </ModalSection>

                {/* Submit Button */}
                <button
                    onClick={handleSubmit}
                    disabled={!name.trim() || updateLoading}
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
                    {updateLoading && <Icon icon="line-md:loading-twotone-loop" className="text-xl" />}
                    {updateLoading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
            </div>
        </ModalLayout>
    );
});

