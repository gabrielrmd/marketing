"use client";

import { useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

export function AssetUploader({ onUpload }: { onUpload: () => void }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();

  const handleFiles = useCallback(async (files: FileList) => {
    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setUploading(false); return; }

    for (const file of Array.from(files)) {
      const path = `${user.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("assets").upload(path, file);
      if (!error) {
        await supabase.from("assets").insert({
          filename: file.name, storage_path: path, mime_type: file.type,
          size_bytes: file.size, tags: [], uploaded_by: user.id,
        });
      }
    }
    setUploading(false);
    onUpload();
  }, [supabase, onUpload]);

  return (
    <label
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer",
        dragging ? "border-primary bg-primary/5" : "border-border",
        uploading && "opacity-50 pointer-events-none"
      )}
    >
      <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{uploading ? "Uploading..." : "Drag files here or click to upload"}</p>
      <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files)} />
    </label>
  );
}
