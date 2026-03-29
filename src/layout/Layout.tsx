import { Icon } from "@iconify/react";
import { Link, useLocation } from "react-router-dom";
import { AlertContainer } from "@/layout/AlertContainer";
import { useRoomStore } from "@/room/store/roomStore";
import { useUserStore } from "@/stores/userStore";
import { useEffect, useRef } from "react";
import { ModalRef } from "./ModalLayout";
import { UserModal } from "@/components/modals/UserModal";

interface NavOptionProps {
    icon: string;
    label: string;
    href?: string;
    locked?: boolean;
}

const NavOption = ({ icon, label, href = "#", locked = false }: NavOptionProps) => {
    const { pathname } = useLocation();
    const isActive = pathname === href || (href !== "#" && pathname.startsWith(href + "/"));

    if (locked) {
        return (
            <div
                className={`
                    relative flex flex-col md:flex-row items-center justify-center lg:justify-start
                    w-full gap-4 p-3 lg:p-6
                    text-slate-500 opacity-30
                    cursor-not-allowed
                    transition-all
                `}
                title={`${label} (Locked)`}
            >
                <div className="relative">
                    <Icon
                        icon={icon}
                        className="text-3xl lg:text-4xl"
                    />
                    <Icon
                        icon="material-symbols:lock"
                        className="absolute -bottom-1 -right-1 text-xl"
                    />
                </div>
                <span className="hidden lg:block text-sm uppercase tracking-widest">
                    {label}
                </span>
            </div>
        );
    }

    return (
        <Link
            className={`
                relative flex flex-col md:flex-row items-center justify-center lg:justify-start
                w-full gap-4 p-3 lg:p-6
                text-slate-500 hover:text-cyan-400 
                transition-all
                ${isActive && "sidebar-active"}
            `}
            to={href}
            title={label}
        >
            <Icon
                icon={icon}
                className="text-3xl lg:text-4xl"
            />
            <span className="hidden lg:block text-sm uppercase tracking-widest">
                {label}
            </span>
        </Link>
    );
};

const MENU_ITEMS = [
    { icon: "gridicons:customize", label: "Personalizar", href: "/customize" },
    { icon: "fluent:people-team-20-filled", label: "Sala", href: "/" },
    { icon: "material-symbols-light:swords", label: "Encuentros", href: "/matches", requiresRoom: true },
];

export const Layout = ({ children }: { children: React.ReactNode }) => {
    const activeRoom = useRoomStore(state => state.activeRoom);
    const { user } = useUserStore();
    const userModalRef = useRef<ModalRef>(null);

    const handleOpenUserModal = () => {
        userModalRef.current?.open();
    };

    // Abre el modal automáticamente si no hay usuario
    useEffect(() => {
        if (!user) {
            userModalRef.current?.open();
        }
    }, [user]);


    return (
        <div className="
            flex flex-col-reverse md:flex-row
            h-dvh w-dvw 
            bg-slate-950 scanline
        ">
            <AlertContainer />
            <UserModal ref={userModalRef} />

            <aside className="
                flex flex-col items-center
                border-t md:border-t-0 md:border-r 
                border-slate-800 bg-slate-900
            ">
                <span className="hidden md:block p-6 mr-auto">
                    <div className="text-xs text-cyan-400 font-bold tracking-widest uppercase">
                        Real-Time Overlay
                    </div>
                    <h1 className="text-2xl text-slate-200 text-nowrap font-bold tracking-tighter">
                        DRAFT LAB
                        <span className="text-cyan-400">.</span>
                    </h1>
                </span>

                <nav className="w-full flex md:flex-col">
                    {MENU_ITEMS.map((item) => {
                        const isLocked = 'requiresRoom' in item && item.requiresRoom && !activeRoom;

                        return (
                            <NavOption
                                key={item.href}
                                icon={item.icon}
                                label={item.label}
                                href={item.href}
                                locked={isLocked}
                            />
                        );
                    })}
                    <button
                        onClick={handleOpenUserModal}
                        className={`
                            block md:hidden w-full gap-4 p-3 lg:p-6
                            text-slate-500 hover:text-cyan-400 
                            transition-all
                        `}
                    >
                        <Icon
                            icon="material-symbols:account-circle"
                            className="text-3xl lg:text-4xl"
                        />
                    </button>
                </nav>
                <div className="hidden md:block lg:w-70 mt-auto p-6">
                    <div
                        onClick={handleOpenUserModal}
                        className="
                            flex items-center
                            p-4 gap-3 cursor-pointer hover:border-cyan-400 transition-all
                            rounded-bl-xl rounded-tr-xl 
                            border beveled-bl-tr
                            bg-slate-950/30 border-slate-700
                        "
                    >
                        <div className="
                            flex items-center justify-center
                            w-10 h-10
                            border rounded-full
                            bg-primary/20 border-primary/50
                        ">
                            <span className="material-icons-outlined text-primary text-lg">
                                {user?.username[0].toUpperCase()}
                            </span>
                        </div>
                        <div className="hidden lg:block overflow-hidden">
                            <p className="text-base font-display text-white truncate">
                                {user?.username}
                            </p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                                Cambiar nombre
                            </p>
                        </div>
                    </div>
                </div>
            </aside>
            {/* Main content area */}
            <main className="flex-1 overflow-auto custom-scrollbar transition-all overflow-x-hidden">
                {children}
            </main>
        </div>
    );
};