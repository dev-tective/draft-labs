import { Icon } from "@iconify/react";
import { useState } from "react";

interface Props {
    title: string;
    icon: string;
    iconColor?: string;
    children: React.ReactNode;
}

export const ModalSection = ({ title, icon, iconColor = 'text-cyan-400', children }: Props) => {
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
                    onClick={() => setShow(!show)}
                />
            </h2>

            {show && children}
        </div >
    );
};