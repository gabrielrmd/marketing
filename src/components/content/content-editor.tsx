"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import CharacterCount from "@tiptap/extension-character-count";
import { Button } from "@/components/ui/button";
import { Bold, Italic, List, ListOrdered, Heading2, Heading3, Undo, Redo } from "lucide-react";
import { cn } from "@/lib/utils";

type ContentEditorProps = {
  content?: Record<string, unknown>;
  onChange?: (json: Record<string, unknown>) => void;
  placeholder?: string;
  maxCharacters?: number;
};

function ToolbarButton({ active, onClick, children }: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <Button variant="ghost" size="sm" onClick={onClick} className={cn("h-8 w-8 p-0", active && "bg-muted")}>
      {children}
    </Button>
  );
}

export function ContentEditor({ content, onChange, placeholder = "Start writing...", maxCharacters }: ContentEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
      Link.configure({ openOnClick: false }),
      Image,
      ...(maxCharacters ? [CharacterCount.configure({ limit: maxCharacters })] : []),
    ],
    content: content as Record<string, unknown> | undefined,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON() as Record<string, unknown>);
    },
  });

  if (!editor) return null;

  const charCount = editor.storage.characterCount?.characters() ?? 0;

  return (
    <div className="rounded-lg border">
      <div className="flex flex-wrap items-center gap-1 border-b p-2">
        <ToolbarButton active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <div className="ml-auto flex items-center gap-2">
          <ToolbarButton onClick={() => editor.chain().focus().undo().run()}><Undo className="h-4 w-4" /></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().redo().run()}><Redo className="h-4 w-4" /></ToolbarButton>
          {maxCharacters && <span className="text-xs text-muted-foreground">{charCount}/{maxCharacters}</span>}
        </div>
      </div>
      <EditorContent editor={editor} className="prose prose-sm max-w-none p-4 [&_.ProseMirror]:min-h-[200px] [&_.ProseMirror]:outline-none" />
    </div>
  );
}
