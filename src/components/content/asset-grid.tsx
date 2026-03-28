"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Trash2 } from "lucide-react";
import type { Asset } from "@/lib/content/types";

export function AssetGrid({ refreshKey }: { refreshKey: number }) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [search, setSearch] = useState("");
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("assets").select("*").order("created_at", { ascending: false });
      if (data) setAssets(data as Asset[]);
    }
    load();
  }, [refreshKey]);

  async function handleDelete(asset: Asset) {
    if (!confirm(`Delete ${asset.filename}?`)) return;
    await supabase.storage.from("assets").remove([asset.storage_path]);
    await supabase.from("assets").delete().eq("id", asset.id);
    setAssets((prev) => prev.filter((a) => a.id !== asset.id));
  }

  const filtered = assets.filter((a) =>
    a.filename.toLowerCase().includes(search.toLowerCase()) ||
    a.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search assets..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {filtered.map((asset) => {
          const url = supabase.storage.from("assets").getPublicUrl(asset.storage_path).data.publicUrl;
          return (
            <div key={asset.id} className="group relative rounded-lg border overflow-hidden">
              {asset.mime_type.startsWith("image/") ? (
                <img src={url} alt={asset.filename} className="aspect-square object-cover w-full" />
              ) : (
                <div className="flex aspect-square items-center justify-center bg-muted text-xs text-muted-foreground">{asset.mime_type.split("/")[1]}</div>
              )}
              <div className="p-2"><p className="truncate text-xs">{asset.filename}</p></div>
              <Button variant="destructive" size="sm"
                className="absolute right-1 top-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleDelete(asset)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          );
        })}
      </div>
      {filtered.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No assets found.</p>}
    </div>
  );
}
