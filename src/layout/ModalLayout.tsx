import { forwardRef, useImperativeHandle, useState } from "react";

interface Props {
    bg?: boolean;
    children: React.ReactNode;
    isOpen?: boolean;
    canClose?: boolean;
}

export interface ModalRef {
    open: () => void;
    close: () => void;
}

export const ModalLayout = forwardRef<ModalRef, Props>(({ children, bg = true, isOpen, canClose = true }, ref) => {
    const [show, setShow] = useState(false);

    // Expose open and close methods to parent components
    useImperativeHandle(ref, () => ({
        open: () => setShow(true),
        close: () => {
            setShow(false);
        },
    }));

    const handleClose = () => {
        if (canClose) setShow(false);
    };

    // Use external isOpen if provided, otherwise use internal state
    const shouldShow = isOpen !== undefined ? isOpen : show;

    // Don't render if not shown
    if (!shouldShow) return null;

    return (
        <div className={`
            fixed flex items-center justify-center 
            h-dvh w-dvw
            left-0 top-0 z-20 
            ${!bg && 'pointer-events-none'}
        `}>
            {bg &&
                <div
                    onClick={handleClose}
                    className="h-full w-full bg-slate-950/85"
                />
            }
            {children}
        </div>
    );
});