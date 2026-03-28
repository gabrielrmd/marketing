"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ContactFilters, type ContactFilterValues } from "@/components/crm/contact-filters";
import { LeadScoreBadge } from "@/components/crm/lead-score-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getContacts } from "@/lib/crm/queries";
import { FUNNEL_STAGES } from "@/lib/constants";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import type { Contact } from "@/lib/funnel/types";

const PAGE_SIZE = 50;

type Props = {
  initialContacts: Contact[];
  initialTotal: number;
};

export function ContactsClient({ initialContacts, initialTotal }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(0);
  const [activeFilters, setActiveFilters] = useState<ContactFilterValues>({});

  const totalPages = Math.ceil(total / PAGE_SIZE);

  async function fetchContacts(filters: ContactFilterValues, offset: number) {
    const result = await getContacts({
      stage: filters.stage || undefined,
      score_min: filters.score_min ?? undefined,
      score_max: filters.score_max ?? undefined,
      tags: filters.tag ? [filters.tag] : undefined,
      source: filters.source || undefined,
      assigned_to: filters.assigned_to || undefined,
      search: filters.search || undefined,
      limit: PAGE_SIZE,
      offset,
    });

    if (result.data) {
      setContacts(result.data as Contact[]);
      setTotal(result.count ?? 0);
    }
  }

  function handleFilterChange(filters: ContactFilterValues) {
    setActiveFilters(filters);
    setPage(0);
    startTransition(async () => {
      await fetchContacts(filters, 0);
    });
  }

  function handlePrev() {
    const newPage = page - 1;
    setPage(newPage);
    startTransition(async () => {
      await fetchContacts(activeFilters, newPage * PAGE_SIZE);
    });
  }

  function handleNext() {
    const newPage = page + 1;
    setPage(newPage);
    startTransition(async () => {
      await fetchContacts(activeFilters, newPage * PAGE_SIZE);
    });
  }

  function handleRowClick(contactId: string) {
    router.push(`/crm/contacts/${contactId}`);
  }

  return (
    <div className="space-y-4">
      <ContactFilters onChange={handleFilterChange} />

      {/* Table */}
      <div className="rounded-lg border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Stage</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Score</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tags</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Source</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Assigned</th>
            </tr>
          </thead>
          <tbody>
            {contacts.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-muted-foreground">
                  No contacts found.
                </td>
              </tr>
            ) : (
              contacts.map((contact) => {
                const stageLabel =
                  FUNNEL_STAGES.find((s) => s.id === contact.stage)?.label ??
                  contact.stage;
                const assigned = (contact as Contact & { assigned_to?: string | null }).assigned_to;

                return (
                  <tr
                    key={contact.id}
                    onClick={() => handleRowClick(contact.id)}
                    className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-medium">
                      {contact.name ?? (
                        <span className="text-muted-foreground italic">Unnamed</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{contact.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs">
                        {stageLabel}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <LeadScoreBadge score={contact.lead_score} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {contact.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {contact.tags.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{contact.tags.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {contact.source ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                      {assigned ? `${assigned.slice(0, 8)}…` : "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {page + 1} of {totalPages} ({total} total)
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrev}
              disabled={page === 0}
              className="gap-1"
            >
              <ChevronLeftIcon className="h-4 w-4" />
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={page >= totalPages - 1}
              className="gap-1"
            >
              Next
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
