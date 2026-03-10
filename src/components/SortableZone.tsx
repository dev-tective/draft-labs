import { useDragDropMonitor } from "@dnd-kit/react";
import { isSortable } from "@dnd-kit/react/sortable";
import { ReactNode, useEffect, useState } from "react";

export interface BaseItem {
    id: string | number;
    order?: number | null;
}

interface Props<T extends BaseItem> {
    items: T[];
    onReorder?: (items: { id: string | number; order: number }[]) => void;
    onDropOutside?: (item: T) => void;
    renderItem: (item: T, index: number) => ReactNode;
    className?: string;
}

export const SortableZone = <T extends BaseItem>({
    items,
    onReorder,
    onDropOutside,
    renderItem,
    className
}: Props<T>) => {
    const [localItems, setLocalItems] = useState<T[]>(items);

    useEffect(() => {
        setLocalItems((prev) => {
            const prevIds = prev.map((i) => i.id);
            const currIds = items.map((d) => d.id);

            // Actualiza datos de los que ya estaban
            const updated = prev
                .filter((p) => currIds.includes(p.id))
                .map((p) => items.find((np) => np.id === p.id) ?? p);

            // Agrega los nuevos al final
            const added = items.filter((p) => !prevIds.includes(p.id));
            const merged = [...updated, ...added];

            // Sort merged list by order
            return merged.sort((a, b) => ((a.order ?? 999) - (b.order ?? 999)));
        });
    }, [items]);

    useDragDropMonitor({
        onDragEnd({ operation, canceled }) {
            if (canceled || !operation.source || !isSortable(operation.source)) return;

            // Encontramos el item en nuestra lista local
            const item = localItems.find(i => i.id === operation.source?.id);
            if (!item) return;

            // Soltado fuera de todo droppable/sortable → llamar onDropOutside
            if (operation.target === null) {
                onDropOutside?.(item);
                return;
            }

            // Patrón oficial dnd-kit: usar initialIndex e index del source
            const { initialIndex, index } = operation.source as { initialIndex: number; index: number };
            if (initialIndex !== index) {
                setLocalItems((prev) => {
                    const next = [...prev];
                    const [removed] = next.splice(initialIndex, 1);
                    next.splice(index, 0, removed);

                    onReorder?.(next.map((p, i) => ({ id: p.id, order: i + 1 })));

                    return next;
                });
            }
        },
    });

    return (
        <div className={`flex ${className}`}>
            {localItems.map((item, index) => renderItem(item, index))}
        </div>
    );
};