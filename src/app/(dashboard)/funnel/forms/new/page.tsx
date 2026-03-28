"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FormBuilder, type FormConfig } from "@/components/funnel/form-builder";
import { createLandingPage } from "@/lib/funnel/actions";

const DEFAULT_CONFIG: FormConfig = {
  title: "",
  heading: "",
  buttonLabel: "Subscribe",
  autoTags: [],
  styleVariant: "inline",
};

export default function NewFormPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [config, setConfig] = useState<FormConfig>(DEFAULT_CONFIG);
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    if (!config.title.trim()) {
      setError("Please enter a form title.");
      return;
    }
    setError(null);

    startTransition(async () => {
      const slug = `form-${Date.now()}`;
      const result = await createLandingPage({
        title: config.title.trim(),
        slug,
        blocks: [
          {
            id: crypto.randomUUID(),
            type: "form",
            content: {
              heading: config.heading.trim(),
              buttonLabel: config.buttonLabel.trim() || "Subscribe",
              autoTags: config.autoTags,
              styleVariant: config.styleVariant,
            },
          },
        ],
      });

      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        router.push(`/funnel/forms/${(result.data as { id: string }).id}`);
      }
    });
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-[family-name:var(--font-oswald)] text-3xl font-bold tracking-tight">
          New Form
        </h1>
        <p className="text-muted-foreground">
          Build an embeddable opt-in form.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <FormBuilder config={config} onChange={setConfig} />

      <div className="flex items-center gap-3 pb-6">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? "Creating..." : "Create Form"}
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push("/funnel/forms")}
          disabled={isPending}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
