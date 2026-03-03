import { Icon } from "@iconify/react";
import { useHeroesStore } from "../../stores/heroesStore";
import { Teams, useDraftStore } from "../../stores/draftStore";
import { Tag, useTagsStore } from "@/stores/tagStore";

interface TagOptionProps {
    tag: Tag;
}

const TagOption = ({ tag }: TagOptionProps) => {
    const { filterHeroesByLane } = useHeroesStore();
    const { selectedLane } = useTagsStore();

    const handleSelectLane = () => {
        filterHeroesByLane(tag.id === selectedLane ? 0 : tag.id);
    }

    return (
        <button
            className={`h-full aspect-[1.5/1] hover:bg-slate-700 transition-colors
                cursor-pointer border-r border-slate-700 last:border-r-0
                ${tag.id === selectedLane ? 'bg-slate-700' : ''}`}
            title={tag.name}
            onClick={handleSelectLane}
        >
            {tag.image ? (
                <div className={`mx-auto h-full aspect-square scale-55
                        ${tag.id === selectedLane ? 'bg-slate-300' : 'bg-slate-400'}`}
                    style={{
                        maskImage: `url(${tag.image})`,
                        maskSize: 'cover',
                        maskPosition: 'center',
                        maskRepeat: 'no-repeat',
                    }}
                />
            ) : (
                <span>{tag.name}</span>
            )}
        </button>
    );
}

export const TagFilters = () => {
    const {
        resetDraft,
        loading,
        draftSlotManage: { activeTeam },
        switchActiveTeam,
    } = useDraftStore();

    const { setSearchQuery, searchQuery } = useHeroesStore();
    const { lanes } = useTagsStore();

    return (
        <div className="flex flex-wrap w-full gap-2">
            <label className="h-10 flex items-center gap-2 px-3 bg-slate-800 border
                border-slate-700 rounded-md text-slate-200 focus-within:border-slate-500 transition-colors">
                <Icon
                    icon="eva:search-outline"
                    className="text-xl text-slate-400"
                />
                <input
                    type="text"
                    placeholder="search"
                    className="h-full bg-transparent outline-none text-slate-100
                        placeholder:text-slate-500 placeholder:uppercase placeholder:text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery('')}
                        className="text-slate-400 hover:text-slate-200 transition-colors"
                        title="Clear search"
                    >
                        <Icon icon="eva:close-outline" className="text-lg" />
                    </button>
                )}
            </label>

            <div className="h-10 flex bg-slate-800 rounded-md border border-slate-700 overflow-hidden">
                {Object.values(Teams).map((team) => (
                    <button
                        key={team}
                        onClick={() => switchActiveTeam(team)}
                        className={`h-full aspect-[1.5/1] transition-colors text-slate-200
                            cursor-pointer border-r border-slate-700 last:border-r-0 capitalize font-semibold
                            ${activeTeam === team ? 'bg-slate-700' : 'hover:bg-slate-700'}`}
                    >
                        {team}
                    </button>
                ))}
            </div>

            <div className="h-10 flex bg-slate-800 rounded-md border border-slate-700 overflow-hidden">
                {lanes.map((lane) => (
                    <TagOption key={lane.id} tag={lane} />
                ))}
            </div>

            <button
                onClick={async () => {
                    try {
                        await resetDraft();
                    } catch (error) {
                        console.error('Failed to reset draft:', error);
                        // Aquí podrías mostrar un toast o mensaje de error al usuario
                    }
                }}
                disabled={loading}
                className={`h-10 flex items-center justify-center gap-2 px-4 rounded-md border 
                    transition-colors text-slate-200
                    ${loading
                        ? 'bg-slate-700 border-slate-600 cursor-not-allowed opacity-70'
                        : 'bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-slate-600'
                    }`}
            >
                {loading ? (
                    <>
                        <Icon icon="eva:loader-outline" className="text-lg animate-spin" />
                        <span>Resetting...</span>
                    </>
                ) : (
                    <>
                        <Icon icon="eva:refresh-outline" className="text-lg" />
                        <span>Reset Draft</span>
                    </>
                )}
            </button>
        </div>
    );
}