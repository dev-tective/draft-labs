import { usePickStore } from "@/stores/pickStore";

export const TeamContainer = () => {
    const { picks } = usePickStore();
    
    return (
        <div>
            {picks.map((pick) => (
                <div key={pick.id}>
                    <h1>{pick.id}</h1>
                </div>
            ))}
        </div>
    );
};