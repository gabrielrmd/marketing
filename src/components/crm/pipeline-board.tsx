"use client";

import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { FUNNEL_STAGES } from "@/lib/constants";
import { PipelineCard } from "./pipeline-card";
import type { Contact } from "@/lib/funnel/types";

type Props = {
  contactsByStage: Record<string, Contact[]>;
  onStageChange: (contactId: string, newStage: string) => void;
};

export function PipelineBoard({ contactsByStage, onStageChange }: Props) {
  const [activeContact, setActiveContact] = useState<Contact | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  function handleDragStart(event: DragStartEvent) {
    const id = event.active.id as string;
    for (const contacts of Object.values(contactsByStage)) {
      const found = contacts.find((c) => c.id === id);
      if (found) {
        setActiveContact(found);
        return;
      }
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveContact(null);
    const { active, over } = event;
    if (!over) return;

    const draggedId = active.id as string;
    const overId = over.id as string;

    // Determine which stage the item was dropped onto
    // overId could be a stage column id or another contact id
    let targetStage: string | null = null;

    // Check if overId is a stage column
    if (FUNNEL_STAGES.some((s) => s.id === overId)) {
      targetStage = overId;
    } else {
      // overId is a contact id — find which stage that contact lives in
      for (const [stage, contacts] of Object.entries(contactsByStage)) {
        if (contacts.some((c) => c.id === overId)) {
          targetStage = stage;
          break;
        }
      }
    }

    if (!targetStage) return;

    // Find current stage of dragged contact
    let currentStage: string | null = null;
    for (const [stage, contacts] of Object.entries(contactsByStage)) {
      if (contacts.some((c) => c.id === draggedId)) {
        currentStage = stage;
        break;
      }
    }

    if (targetStage !== currentStage) {
      onStageChange(draggedId, targetStage);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[600px]">
        {FUNNEL_STAGES.map((stage) => {
          const contacts = contactsByStage[stage.id] ?? [];
          const contactIds = contacts.map((c) => c.id);

          return (
            <div
              key={stage.id}
              id={stage.id}
              className="flex flex-col w-64 shrink-0"
            >
              {/* Column header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="font-[family-name:var(--font-oswald)] text-sm font-medium uppercase tracking-wide text-foreground">
                  {stage.label}
                </h3>
                <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5 font-medium">
                  {contacts.length}
                </span>
              </div>

              {/* Drop zone / card list */}
              <div
                id={stage.id}
                className="flex-1 rounded-lg border border-dashed bg-muted/30 p-2 min-h-[120px] space-y-2"
              >
                <SortableContext
                  items={contactIds}
                  strategy={verticalListSortingStrategy}
                >
                  {contacts.map((contact) => (
                    <PipelineCard key={contact.id} contact={contact} />
                  ))}
                </SortableContext>

                {contacts.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    No contacts
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Drag overlay — renders a ghost card while dragging */}
      <DragOverlay>
        {activeContact ? (
          <div className="opacity-90 rotate-1 scale-105">
            <PipelineCard contact={activeContact} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
