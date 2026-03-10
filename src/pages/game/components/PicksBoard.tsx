import { DragDropProvider } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { SortableZone } from "@/components/SortableZone";
import { Pick } from "@/stores/pickStore";
import { usePlayerStore } from "@/stores/playerStore";

interface SortablePick extends Pick {
    order: number;
}

const BoardItem = ({ pick, index }: { pick: SortablePick, index: number }) => {
    const player = usePlayerStore.getState().players.find(p => p.id === pick.player_id)

    const { ref, isDragging } = useSortable({
        id: pick.id,
        data: { pick },
        index,
    });

    return (
        <div
            ref={ref}
            className={`
                aspect-square
                border
                border-slate-700
                rounded-lg
                ${isDragging ? 'opacity-90 border-cyan-400' : ''}
                transition-colors
                cursor-grab active:cursor-grabbing
            `}
        >
            <h1>{player?.nickname || `Pick ${pick.pick_order}`}</h1>
        </div>
    );
};

export const PicksBoard = ({ picks }: { picks: Pick[] }) => {
    // Mapear el pick_order a la propiedad order del BaseItem
    const sortablePicks: SortablePick[] = picks.map(p => ({ ...p, order: p.pick_order }));

    return (
        <DragDropProvider>
            <SortableZone
                className="grid grid-cols-5 gap-2"
                items={sortablePicks}
                renderItem={(pick, index) => (
                    <BoardItem key={pick.id} pick={pick as SortablePick} index={index} />
                )}
                onReorder={(items) => {
                    console.log("Reordered UI items:", items);
                    // Aquí conectaríamos con un método del pickStore para persistir el nuevo pick_order
                }}
            />
        </DragDropProvider>
    );
};