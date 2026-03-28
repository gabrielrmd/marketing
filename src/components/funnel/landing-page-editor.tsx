"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PageBlock, PageBlockType } from "@/lib/funnel/types";

type LandingPageEditorProps = {
  blocks: PageBlock[];
  onChange: (blocks: PageBlock[]) => void;
};

const BLOCK_TYPES: { type: PageBlockType; label: string }[] = [
  { type: "hero", label: "Hero" },
  { type: "text", label: "Text" },
  { type: "cta", label: "CTA" },
  { type: "form", label: "Form" },
  { type: "image", label: "Image" },
  { type: "testimonial", label: "Testimonial" },
];

function BlockFields({
  block,
  onUpdate,
}: {
  block: PageBlock;
  onUpdate: (content: Record<string, unknown>) => void;
}) {
  const c = block.content;

  function field(key: string, label: string, placeholder?: string) {
    return (
      <div className="space-y-1" key={key}>
        <label className="text-xs font-medium text-muted-foreground">{label}</label>
        <Input
          size={undefined}
          className="h-8 text-sm"
          value={(c[key] as string) ?? ""}
          placeholder={placeholder}
          onChange={(e) => onUpdate({ ...c, [key]: e.target.value })}
        />
      </div>
    );
  }

  switch (block.type) {
    case "hero":
      return (
        <div className="space-y-2">
          {field("heading", "Heading", "Main headline...")}
          {field("subheading", "Subheading", "Supporting text...")}
        </div>
      );
    case "text":
      return (
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Text</label>
          <textarea
            className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[80px] resize-y"
            value={(c.text as string) ?? ""}
            placeholder="Paragraph text..."
            onChange={(e) => onUpdate({ ...c, text: e.target.value })}
          />
        </div>
      );
    case "cta":
      return (
        <div className="space-y-2">
          {field("heading", "Heading", "Call to action heading...")}
          {field("subheading", "Subheading", "Supporting text...")}
          {field("label", "Button Label", "Click here")}
          {field("url", "Button URL", "https://")}
        </div>
      );
    case "form":
      return (
        <div className="space-y-2">
          {field("heading", "Heading", "Sign up today...")}
          {field("subheading", "Subheading", "Supporting text...")}
          {field("submit_label", "Submit Button Label", "Submit")}
          {field("form_id", "Form ID", "my-form")}
        </div>
      );
    case "image":
      return (
        <div className="space-y-2">
          {field("src", "Image URL", "https://")}
          {field("alt", "Alt Text", "Image description")}
          {field("caption", "Caption", "Optional caption...")}
        </div>
      );
    case "testimonial":
      return (
        <div className="space-y-2">
          {field("quote", "Quote", "What they said...")}
          {field("author", "Author Name", "Jane Doe")}
          {field("role", "Author Role", "CEO, Company")}
        </div>
      );
    default:
      return null;
  }
}

function SortableBlock({
  block,
  onUpdate,
  onDelete,
}: {
  block: PageBlock;
  onUpdate: (content: Record<string, unknown>) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-lg border bg-card p-4 space-y-3"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            {...attributes}
            {...listeners}
            type="button"
            className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
            aria-label="Drag to reorder"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </button>
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {block.type}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-destructive hover:text-destructive"
          onClick={onDelete}
          type="button"
        >
          Remove
        </Button>
      </div>
      <BlockFields block={block} onUpdate={onUpdate} />
    </div>
  );
}

export function LandingPageEditor({ blocks, onChange }: LandingPageEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function addBlock(type: PageBlockType) {
    const newBlock: PageBlock = {
      id: crypto.randomUUID(),
      type,
      content: {},
    };
    onChange([...blocks, newBlock]);
  }

  function updateBlock(id: string, content: Record<string, unknown>) {
    onChange(blocks.map((b) => (b.id === id ? { ...b, content } : b)));
  }

  function deleteBlock(id: string) {
    onChange(blocks.filter((b) => b.id !== id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex((b) => b.id === active.id);
      const newIndex = blocks.findIndex((b) => b.id === over.id);
      onChange(arrayMove(blocks, oldIndex, newIndex));
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2">
        {BLOCK_TYPES.map(({ type, label }) => (
          <Button
            key={type}
            variant="outline"
            size="sm"
            type="button"
            onClick={() => addBlock(type)}
          >
            + {label}
          </Button>
        ))}
      </div>

      {/* Block list */}
      {blocks.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center border rounded-lg">
          No blocks yet. Use the toolbar above to add content blocks.
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={blocks.map((b) => b.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {blocks.map((block) => (
                <SortableBlock
                  key={block.id}
                  block={block}
                  onUpdate={(content) => updateBlock(block.id, content)}
                  onDelete={() => deleteBlock(block.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
