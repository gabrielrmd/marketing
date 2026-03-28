import { getContacts } from "@/lib/crm/queries";
import { ContactsClient } from "./contacts-client";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";

export default async function ContactsPage() {
  const result = await getContacts({ limit: 50, offset: 0 });
  const contacts = result.data ?? [];
  const total = result.count ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-oswald)] text-3xl font-bold tracking-tight">
            Contacts
          </h1>
          <p className="text-muted-foreground">
            {total} contact{total !== 1 ? "s" : ""} in your CRM.
          </p>
        </div>
        <Link
          href="/crm/contacts/new"
          className={buttonVariants({ size: "sm" })}
        >
          <PlusIcon className="h-4 w-4 mr-1.5" />
          New Contact
        </Link>
      </div>

      <ContactsClient initialContacts={contacts} initialTotal={total} />
    </div>
  );
}
