import { getContentItems } from "@/lib/content/actions";
import { CalendarClient } from "./calendar-client";
import type { ContentItem } from "@/lib/content/types";

export default async function ContentPage() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const result = await getContentItems({
    from: start.toISOString(),
    to: end.toISOString(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-oswald)] text-3xl font-bold tracking-tight">Content</h1>
        <p className="text-muted-foreground">Plan, create, and publish across all channels.</p>
      </div>
      <CalendarClient initialItems={(result.data as ContentItem[]) ?? []} />
    </div>
  );
}
