import { forwardRef, useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { ModalLayout, ModalRef } from "@/layout/ModalLayout";
import { useUserStore } from "@/stores/userStore";

export const UserModal = forwardRef<ModalRef, {}>((_, ref) => {
    const { user, createUser, updateUser } = useUserStore();
    const isEditMode = !!user;

    const [username, setUsername] = useState(user?.username ?? "");
    const [loading, setLoading] = useState(false);

    // Sync input when user changes (e.g. after hydration from localStorage)
    useEffect(() => {
        setUsername(user?.username ?? "");
    }, [user]);

    const handleSubmit = async () => {
        if (!username.trim()) return;

        setLoading(true);

        try {
            if (isEditMode) {
                await updateUser(username.trim());
            } else {
                await createUser(username.trim());
            }

            ref && typeof ref !== "function" && ref.current?.close();
        } catch (err: any) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleSubmit();
    };

    return (
        <ModalLayout ref={ref} canClose={isEditMode}>
            <div className="
                absolute flex flex-col
                max-w-md w-10/12
                p-5 md:p-8 gap-6
                rounded-tr-3xl rounded-bl-3xl
                beveled-bl-tr border beveled
                bg-slate-950 border-cyan-800
            ">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl md:text-2xl text-slate-200 uppercase tracking-widest font-bold italic">
                            {isEditMode ? "Editar Perfil" : "Crear Perfil"}
                        </h1>
                        <p className="text-cyan-500 text-xs md:text-sm tracking-wider uppercase">
                            {isEditMode ? "Actualiza tu nombre de usuario" : "Elige un nombre de usuario para comenzar"}
                        </p>
                    </div>
                    {isEditMode && (
                        <button
                            onClick={() => ref && typeof ref !== "function" && ref.current?.close()}
                            disabled={loading}
                            className="text-slate-500 hover:text-cyan-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <Icon icon="mdi:close" className="text-3xl" />
                        </button>
                    )}
                </div>

                {/* Avatar Preview */}
                {/* <div className="flex justify-center">
                    <div className="
                        w-20 h-20
                        rounded-tr-2xl rounded-bl-2xl
                        beveled-bl-tr border border-cyan-800
                        bg-slate-900
                        flex items-center justify-center
                    ">
                        <Icon
                            icon="mdi:account"
                            className="text-5xl text-cyan-700"
                        />
                    </div>
                </div> */}

                {/* Username Field */}
                <div className="space-y-4">
                    <h2 className="
                        flex items-center
                        text-xs md:text-sm
                        text-slate-200 uppercase tracking-widest
                    ">
                        <Icon
                            icon="mdi:account-edit"
                            className="text-lg md:text-2xl mr-3 text-cyan-400"
                        />
                        Username
                    </h2>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ingresa tu nombre de usuario"
                        autoFocus
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

                    {/* Current user info in edit mode */}
                    {isEditMode && (
                        <p className="text-xs text-slate-500 tracking-wider">
                            Actual:{" "}
                            <span className="text-cyan-600 font-semibold">{user.username}</span>
                            {" "}· ID: <span className="text-slate-400">{user.id}</span>
                        </p>
                    )}
                </div>

                {/* Submit Button */}
                <button
                    onClick={handleSubmit}
                    disabled={!username.trim() || loading}
                    className="
                        w-full py-3 md:py-4
                        text-sm font-bold uppercase
                        tracking-widest beveled-bl-tr
                        border rounded-tr-2xl rounded-bl-2xl
                        bg-cyan-950/70 border-cyan-400 text-cyan-400
                        transition-all
                        hover:bg-cyan-400 hover:text-slate-950
                        disabled:opacity-50 disabled:cursor-not-allowed
                        flex items-center justify-center gap-2
                    "
                >
                    {loading ? (
                        <>
                            <Icon icon="line-md:loading-twotone-loop" className="text-xl" />
                            {isEditMode ? "Guardando..." : "Creando..."}
                        </>
                    ) : (
                        isEditMode ? "Guardar Cambios" : "Crear Perfil"
                    )}
                </button>
            </div>
        </ModalLayout>
    );
});