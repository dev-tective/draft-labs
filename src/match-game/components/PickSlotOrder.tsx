import { DragDropProvider, useDragDropMonitor } from "@dnd-kit/react";
import { isSortable } from "@dnd-kit/react/sortable";
import { useEffect, useState } from "react";
import { Pick } from "../match-game.types";
import { PickSlot } from "./PickSlot";
import { usePickAndBanStore } from "../store/pickAndBanStore";

const PickListContainer = ({ picks }: { picks: Pick[] }) => {
    const { updatePick } = usePickAndBanStore();
    const [localPicks, setLocalPicks] = useState<Pick[]>(picks);
    const [isReordering, setIsReordering] = useState(false);

    useEffect(() => {
        setLocalPicks((prev) => {
            const prevIds = prev.map((p) => p.id);
            const currIds = picks.map((p) => p.id);

            // Actualiza datos de los que ya estaban
            const updated = prev
                .filter((p) => currIds.includes(p.id))
                .map((p) => picks.find((np) => np.id === p.id) ?? p);

            // Agrega los nuevos al final
            const added = picks.filter((p) => !prevIds.includes(p.id));
            const merged = [...updated, ...added];

            if (isReordering) {
                // Conserva el índice local actual mientras terminan las promesas
                const prevOrderMap = new Map(prev.map((p, i) => [p.id, i]));
                return merged.sort((a, b) => {
                    const indexA = prevOrderMap.get(a.id) ?? 999;
                    const indexB = prevOrderMap.get(b.id) ?? 999;
                    return indexA - indexB;
                });
            }

            // Ordenamos por pick_order
            return merged.sort((a, b) => ((a.pick_order ?? 999) - (b.pick_order ?? 999)));
        });
    }, [picks, isReordering]);

    useDragDropMonitor({
        async onDragEnd({ operation, canceled }) {
            if (canceled || !operation.source || !isSortable(operation.source)) return;

            const item = localPicks.find(p => p.id === operation.source?.id);
            if (!item) return;

            if (operation.target === null) return;

            const { initialIndex, index } = operation.source as { initialIndex: number; index: number };
            if (initialIndex !== index) {
                let nextOrder: Pick[] = [];
                setLocalPicks((prev) => {
                    const next = [...prev];
                    const [removed] = next.splice(initialIndex, 1);
                    next.splice(index, 0, removed);
                    nextOrder = next;
                    return next;
                });

                setIsReordering(true);
                try {
                    // Despachamos simultáneamente todas las promesas al backend
                    const promises = nextOrder.map((p, i) => updatePick(p.id, { pick_order: i + 1 }));
                    await Promise.all(promises);
                } finally {
                    setIsReordering(false);
                }
            }
        },
    });

    return (
        <div className="grid grid-cols-1 grid-rows-5 gap-1 flex-1">
            {localPicks.map((pick, index) => (
                <PickSlot key={pick.id} pick={pick} index={index} />
            ))}
        </div>
    );
};

export const PickSlotOrder = ({ picks }: { picks: Pick[] }) => {
    return (
        <DragDropProvider>
            <PickListContainer picks={picks} />
        </DragDropProvider>
    );
};
