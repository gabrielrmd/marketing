"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PipelineBoard } from "@/components/crm/pipeline-board";
import { ContactFilters, type ContactFilterValues } from "@/components/crm/contact-filters";
import { updateContactStage } from "@/lib/crm/actions";
import { getContacts } from "@/lib/crm/queries";
import type { Contact, ContactStage } from "@/lib/funnel/types";

type Props = {
  contactsByStage: Record<string, Contact[]>;
};

export function PipelineClient({ contactsByStage: initial }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [contactsByStage, setContactsByStage] = useState(initial);

  function handleStageChange(contactId: string, newStage: string) {
    // Optimistically update the local state
    setContactsByStage((prev) => {
      const next = { ...prev };
      let moved: Contact | undefined;

      for (const stage of Object.keys(next)) {
        const idx = next[stage].findIndex((c) => c.id === contactId);
        if (idx !== -1) {
          moved = next[stage][idx];
          next[stage] = next[stage].filter((c) => c.id !== contactId);
          break;
        }
      }

      if (moved) {
        next[newStage] = [
          { ...moved, stage: newStage as ContactStage },
          ...(next[newStage] ?? []),
        ];
      }

      return next;
    });

    startTransition(async () => {
      await updateContactStage(contactId, newStage as ContactStage);
      router.refresh();
    });
  }

  async function handleFilterChange(filters: ContactFilterValues) {
    const result = await getContacts({
      stage: filters.stage || undefined,
      score_min: filters.score_min ?? undefined,
      score_max: filters.score_max ?? undefined,
      tags: filters.tag ? [filters.tag] : undefined,
      source: filters.source || undefined,
      assigned_to: filters.assigned_to || undefined,
      search: filters.search || undefined,
    });

    if (result.data) {
      const grouped: Record<string, Contact[]> = {};
      for (const contact of result.data) {
        const stage = contact.stage as string;
        if (!grouped[stage]) grouped[stage] = [];
        grouped[stage].push(contact as Contact);
      }
      setContactsByStage(grouped);
    }
  }

  return (
    <div className="space-y-4">
      <ContactFilters onChange={handleFilterChange} />

      <div
        className={isPending ? "opacity-60 pointer-events-none transition-opacity" : ""}
      >
        <PipelineBoard
          contactsByStage={contactsByStage}
          onStageChange={handleStageChange}
        />
      </div>
    </div>
  );
}
