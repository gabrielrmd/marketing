"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { AU_CHANNELS } from "@/lib/constants";
import type { ContentTemplate } from "@/lib/content/types";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<ContentTemplate[]>([]);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("content_templates").select("*").order("created_at", { ascending: false });
      if (data) setTemplates(data as ContentTemplate[]);
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-oswald)] text-3xl font-bold tracking-tight">Templates</h1>
        <p className="text-muted-foreground">Reusable content templates with AU brand voice.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => {
          const channel = AU_CHANNELS.find((c) => c.id === template.channel);
          return (
            <Card key={template.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium">{template.name}</h3>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                </div>
                <Badge variant="secondary">{channel?.label}</Badge>
              </div>
              <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/content/new?template=${template.id}`)}>
                <Copy className="mr-1 h-4 w-4" /> Use Template
              </Button>
            </Card>
          );
        })}
        {templates.length === 0 && (
          <p className="col-span-full text-center text-sm text-muted-foreground py-8">No templates yet.</p>
        )}
      </div>
    </div>
  );
}
