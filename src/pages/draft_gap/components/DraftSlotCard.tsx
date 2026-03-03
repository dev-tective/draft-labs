import { Icon } from "@iconify/react";
import { useHeroesStore } from "../../../stores/heroesStore";

interface Props {
    draftSlot: any;
}

export const DraftSlotCard = ({ draftSlot }: Props) => {
    // const { draftSlotManage: { selectedSlot }, setCurrentSlot, lockedSlot } = useDraftStore();
    // const { findHeroById } = useHeroesStore();

    // const hero = findHeroById(draftSlot.hero_id);

    return (
        <div
            className="flex flex-col justify-between w-full h-full border-b-2 last:border-b-0 border-slate-700
                text-slate-200 font-semibold relative"
            // style={{
            //     backgroundImage: `url(${hero?.image_profile_url})`,
            //     backgroundSize: "cover",
            //     backgroundPosition: "center 15%",
            // }}
        >
            {/* <button
                onClick={() => {
                    if (!draftSlot.is_locked) setCurrentSlot(draftSlot)
                }}
                className={`absolute inset-0 bg-linear-to-b z-0
                from-slate-950/85 via-transparent to-slate-950/85`}
            />

            {selectedSlot?.id === draftSlot.id && (
                <div className="animate-pulse duration-50 ease-in-out absolute inset-0 z-1 pointer-events-none border-2 border-yellow-400" />
            )}


            <div className="uppercase h-full w-4/5 flex flex-col justify-between z-1 py-2 pl-2 pointer-events-none">
                <span className="text-amber-300 text-lg">{hero?.name || '??'}</span>
                <span className="text-sm">{draftSlot.nickname}</span>
            </div>

            <button
                className="hover:bg-slate-400/70 py-2 px-1 rounded-bl-sm transition-colors absolute top-0 right-0 z-10"
            >
                <Icon icon="iconamoon:menu-kebab-vertical-bold" className="text-2xl" />
            </button>

            <button
                onClick={() => lockedSlot(draftSlot, { is_locked: !draftSlot.is_locked })}
                className={`${draftSlot.is_locked ? 'opacity-100' : 'opacity-50'} hover:opacity-100 absolute bottom-0 right-0 z-10 p-2 text-2xl transition`}
            >
                {draftSlot.is_locked ? (
                    <Icon icon="heroicons-solid:lock-closed" />
                ) : (
                    <Icon icon="heroicons-solid:lock-open" />
                )}
            </button> */}
        </div>
    );
};