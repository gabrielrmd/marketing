"use client";

import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type FormConfig = {
  title: string;
  heading: string;
  buttonLabel: string;
  autoTags: string[];
  styleVariant: "inline" | "popup" | "slide-in";
};

type FormBuilderProps = {
  config: FormConfig;
  onChange: (config: FormConfig) => void;
};

const STYLE_VARIANTS: { value: FormConfig["styleVariant"]; label: string; description: string }[] = [
  { value: "inline", label: "Inline", description: "Embed directly in the page" },
  { value: "popup", label: "Popup", description: "Show as a modal overlay" },
  { value: "slide-in", label: "Slide-in", description: "Slide in from bottom-right" },
];

export function FormBuilder({ config, onChange }: FormBuilderProps) {
  function update(patch: Partial<FormConfig>) {
    onChange({ ...config, ...patch });
  }

  function addTag(raw: string) {
    const tag = raw.trim();
    if (!tag || config.autoTags.includes(tag)) return;
    update({ autoTags: [...config.autoTags, tag] });
  }

  function removeTag(tag: string) {
    update({ autoTags: config.autoTags.filter((t) => t !== tag) });
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(e.currentTarget.value);
      e.currentTarget.value = "";
    }
  }

  return (
    <div className="space-y-6">
      {/* Form Content */}
      <Card>
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-oswald)] text-lg">
            Form Content
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Form Title (internal)</label>
            <Input
              value={config.title}
              onChange={(e) => update({ title: e.target.value })}
              placeholder="e.g. Newsletter Signup"
            />
            <p className="text-xs text-muted-foreground">
              Used internally. Not shown to visitors.
            </p>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Heading</label>
            <Input
              value={config.heading}
              onChange={(e) => update({ heading: e.target.value })}
              placeholder="Join our newsletter"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Submit Button Label</label>
            <Input
              value={config.buttonLabel}
              onChange={(e) => update({ buttonLabel: e.target.value })}
              placeholder="Subscribe"
            />
          </div>
        </CardContent>
      </Card>

      {/* Auto-tags */}
      <Card>
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-oswald)] text-lg">
            Auto-Tags
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Tags applied automatically to contacts who submit this form.
          </p>
          <div className="space-y-1.5">
            <Input
              placeholder="Type a tag and press Enter"
              onKeyDown={handleTagKeyDown}
              onBlur={(e) => {
                if (e.target.value.trim()) {
                  addTag(e.target.value);
                  e.target.value = "";
                }
              }}
            />
          </div>
          {config.autoTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {config.autoTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label={`Remove ${tag}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Style Variant */}
      <Card>
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-oswald)] text-lg">
            Display Style
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {STYLE_VARIANTS.map(({ value, label, description }) => (
              <label
                key={value}
                className={`flex cursor-pointer flex-col gap-1 rounded-lg border p-3 transition-colors ${
                  config.styleVariant === value
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/30"
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="styleVariant"
                    value={value}
                    checked={config.styleVariant === value}
                    onChange={() => update({ styleVariant: value })}
                    className="accent-primary"
                  />
                  <span className="text-sm font-medium">{label}</span>
                </div>
                <p className="text-xs text-muted-foreground pl-5">{description}</p>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-oswald)] text-lg">
            Form Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-muted/20 p-6 space-y-4 max-w-sm">
            {config.heading && (
              <h3 className="font-[family-name:var(--font-oswald)] text-xl font-bold">
                {config.heading}
              </h3>
            )}
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Name</label>
                <div className="rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground">
                  Your name
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Email</label>
                <div className="rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground">
                  your@email.com
                </div>
              </div>
              <div className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground text-center">
                {config.buttonLabel || "Subscribe"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
