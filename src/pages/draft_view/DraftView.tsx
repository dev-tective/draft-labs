import { useEffect } from "react";
import { useHeroesStore } from "../../stores/heroesStore";
import { getHeroImageSlotUrl } from "../../scripts/hero-images";

const DraftViewSlot = ({ draftSlot }: { draftSlot: any }) => {
    const { findHeroById } = useHeroesStore();

    const hero = findHeroById(draftSlot.hero_id);

    return (
        <div className="flex flex-col h-full w-full">
            <div className={`flex-1 w-full bg-linear-to-b z-0 bg-white`}
                style={{
                    backgroundImage: `url(${getHeroImageSlotUrl(hero)})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }}
            />
            <div className={`aspect-[1/0.2] w-full text-center content-center ${draftSlot.team === 'blue' ? 'bg-cyan-600' : 'bg-red-600'}`}>
                <span className="font-bold uppercase text-slate-200">{draftSlot.nickname}</span>
            </div>
        </div>
    );
}

export const DraftView = () => {
    const { fetchHeroes } = useHeroesStore();

    // const {
    //     getDraftSlotsByTeam,
    //     subscribeToDraft,
    //     unsubscribe,
    // } = useDraftStore();

    // useEffect(() => {
    //     subscribeToDraft('9f7b47de-0ad7-4b94-b61d-0e8291421088');

    //     // Cleanup: unsubscribe when component unmounts
    //     return () => {
    //         unsubscribe();
    //     };
    // }, []);

    // useEffect(() => {
    //     fetchHeroes();
    // }, []);

    return (
        <div className="flex justify-center items-center gap-6 w-dvw h-96">
            {/* <div className="flex h-full shrink-0 flex-1">
                {getDraftSlotsByTeam(Teams.BLUE).map((slot) => (
                    <DraftViewSlot key={slot.id} draftSlot={slot} />
                ))}
            </div>
            <div className="flex h-full shrink-0 flex-1">
                {getDraftSlotsByTeam(Teams.RED).map((slot) => (
                    <DraftViewSlot key={slot.id} draftSlot={slot} />
                ))}
            </div> */}
        </div>
    );
}