"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createLeadMagnet } from "@/lib/funnel/actions";
import { createClient } from "@/lib/supabase/client";

export default function NewLeadMagnetPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fileType, setFileType] = useState("");
  const [deliverySubject, setDeliverySubject] = useState("");
  const [deliveryBody, setDeliveryBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function uploadFile(file: File): Promise<string | null> {
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    setUploadProgress("Uploading file...");

    const { error: uploadError } = await supabase.storage
      .from("lead-magnets")
      .upload(path, file, { upsert: false });

    setUploadProgress(null);
    if (uploadError) {
      setError(`Upload failed: ${uploadError.message}`);
      return null;
    }
    return path;
  }

  function handleSave() {
    if (!title.trim()) {
      setError("Please enter a title.");
      return;
    }
    setError(null);

    startTransition(async () => {
      let filePath: string | null = null;

      if (file) {
        filePath = await uploadFile(file);
        if (filePath === null) return; // upload error already set
      }

      const result = await createLeadMagnet({
        title: title.trim(),
        description: description.trim() || null,
        file_path: filePath,
        file_type: fileType.trim() || null,
        delivery_email_subject: deliverySubject.trim() || null,
        delivery_email_body: deliveryBody.trim() || null,
      });

      if (result.error) {
        setError(result.error);
      } else {
        router.push("/funnel/lead-magnets");
      }
    });
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-[family-name:var(--font-oswald)] text-3xl font-bold tracking-tight">
          New Lead Magnet
        </h1>
        <p className="text-muted-foreground">
          Create a downloadable resource with an automated delivery email.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-oswald)] text-lg">
            Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Title *</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 5-Day Email Course"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description</label>
            <textarea
              className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[80px] resize-y"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this lead magnet about?"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">File Type</label>
              <Input
                value={fileType}
                onChange={(e) => setFileType(e.target.value)}
                placeholder="PDF, Video, ZIP..."
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">File Upload</label>
              <input
                type="file"
                className="w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground hover:file:bg-muted cursor-pointer"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              {uploadProgress && (
                <p className="text-xs text-muted-foreground">{uploadProgress}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-oswald)] text-lg">
            Delivery Email
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This email is sent automatically when someone receives this lead magnet.
          </p>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Subject</label>
            <Input
              value={deliverySubject}
              onChange={(e) => setDeliverySubject(e.target.value)}
              placeholder="Here's your free resource!"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Body</label>
            <textarea
              className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[120px] resize-y"
              value={deliveryBody}
              onChange={(e) => setDeliveryBody(e.target.value)}
              placeholder="Hi {{name}},&#10;&#10;Here is your download link: {{download_url}}"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3 pb-6">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving..." : "Save Lead Magnet"}
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push("/funnel/lead-magnets")}
          disabled={isPending}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
