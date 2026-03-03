import { Hero } from "../../../stores/heroesStore";

export const HeroRow = ({ hero }: { hero: Hero }) => {
    // const { updateSlot } = useDraftStore();

    return (
        <tr
            // onClick={() => updateSlot({ hero_id: hero.id, is_locked: true })}
            className="hover:bg-slate-700 transition-colors border-b border-slate-700 last:border-b-0"
            key={hero.id}
        >
            <td className="flex items-center gap-2 p-3">
                <div className="h-12 aspect-square overflow-hidden">
                    <img
                        src={hero.image_slot_url}
                        alt={hero.name}
                        className="object-cover"
                    />
                </div>
                <span>{hero.name}</span>
            </td>
            <td className="capitalize p-2 w-1/4">{hero.lanes.map((lane) => lane.name).join(', ')}</td>
        </tr>
    );
}