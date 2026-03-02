import { useEffect } from "react";
import { TagFilters } from "./TagFilters";
import { useHeroesStore } from "../../stores/heroesStore";
import { HeroTable } from "./HeroTable";
import { DraftSide } from "./components/DraftSide";

export const DraftGap = () => {
    const { fetchHeroes } = useHeroesStore();

    useEffect(() => {
        fetchHeroes();
    }, []);

    return (
        <main className="w-dvw h-dvh bg-slate-900">
            <div className="flex justify-center items-start gap-6">
                {/* <DraftSide draftSlots={getDraftSlotsByTeam(Teams.BLUE)} />

                <div className="flex flex-col gap-4 min-w-96 w-3/6">
                    <TagFilters />
                    <HeroTable />
                </div>

                <DraftSide draftSlots={getDraftSlotsByTeam(Teams.RED)} /> */}
            </div>
        </main>
    );
}