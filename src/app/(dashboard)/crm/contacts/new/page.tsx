"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ContactForm, type ContactFormData } from "@/components/crm/contact-form";
import { createContact } from "@/lib/crm/actions";
import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";

export default function NewContactPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(data: ContactFormData) {
    setError(null);
    startTransition(async () => {
      const result = await createContact({
        email: data.email,
        name: data.name || null,
        company: data.company || null,
        source: data.source || null,
        stage: data.stage,
        tags: data.tags,
        assigned_to: data.assigned_to || null,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.data) {
        router.push(`/crm/contacts/${result.data.id}`);
      }
    });
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href="/crm/contacts"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Back to Contacts
        </Link>
        <h1 className="font-[family-name:var(--font-oswald)] text-3xl font-bold tracking-tight">
          New Contact
        </h1>
        <p className="text-muted-foreground">Manually add a contact to your CRM.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="rounded-xl border bg-card p-6">
        <ContactForm onSubmit={handleSubmit} isPending={isPending} />
      </div>
    </div>
  );
}
