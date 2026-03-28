"use client";

import { use, useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ContactProfile } from "@/components/crm/contact-profile";
import {
  updateContact,
  addNote,
  createTask,
  completeTask,
  deleteTask,
} from "@/lib/crm/actions";
import { getContact } from "@/lib/crm/queries";
import type { ContactWithDetails } from "@/lib/crm/types";
import type { ContactFormData } from "@/components/crm/contact-form";
import { ChevronLeftIcon } from "lucide-react";
import Link from "next/link";

type Props = {
  params: Promise<{ id: string }>;
};

export default function ContactDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [contact, setContact] = useState<ContactWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadContact() {
    const result = await getContact(id);
    if (result.error) {
      setError(result.error);
    } else if (result.data) {
      setContact(result.data);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadContact();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function refresh() {
    startTransition(async () => {
      const result = await getContact(id);
      if (result.data) setContact(result.data);
      router.refresh();
    });
  }

  async function handleUpdate(data: ContactFormData) {
    const result = await updateContact(id, {
      email: data.email,
      name: data.name || null,
      company: data.company || null,
      source: data.source || null,
      stage: data.stage,
      tags: data.tags,
      assigned_to: data.assigned_to || null,
    });
    if (!result.error) refresh();
  }

  async function handleAddNote(content: string) {
    const result = await addNote(id, content);
    if (!result.error) refresh();
  }

  async function handleAddTask(data: {
    title: string;
    due_date: string | null;
    assigned_to: string | null;
  }) {
    const result = await createTask({
      contact_id: id,
      title: data.title,
      due_date: data.due_date,
      assigned_to: data.assigned_to,
    });
    if (!result.error) refresh();
  }

  async function handleCompleteTask(taskId: string) {
    const result = await completeTask(taskId);
    if (!result.error) refresh();
  }

  async function handleDeleteTask(taskId: string) {
    const result = await deleteTask(taskId);
    if (!result.error) refresh();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-muted-foreground text-sm">Loading contact...</p>
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="space-y-4">
        <Link
          href="/crm/contacts"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Back to Contacts
        </Link>
        <p className="text-destructive">{error ?? "Contact not found."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Link
        href="/crm/contacts"
        className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Back to Contacts
      </Link>

      <ContactProfile
        contact={contact}
        onUpdate={handleUpdate}
        onAddNote={handleAddNote}
        onAddTask={handleAddTask}
        onCompleteTask={handleCompleteTask}
        onDeleteTask={handleDeleteTask}
      />
    </div>
  );
}
