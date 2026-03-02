export const Panel = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="
            flex flex-col items-center justify-center
            min-h-full max-w-md 
            gap-4 px-6 m-auto
            text-center
        ">
            {children}
        </div>
    );
};