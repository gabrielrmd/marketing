"use client";

import { useState } from "react";
import { AssetUploader } from "@/components/content/asset-uploader";
import { AssetGrid } from "@/components/content/asset-grid";

export default function AssetsPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-oswald)] text-3xl font-bold tracking-tight">Asset Library</h1>
        <p className="text-muted-foreground">Upload and manage images, videos, and graphics.</p>
      </div>
      <AssetUploader onUpload={() => setRefreshKey((k) => k + 1)} />
      <AssetGrid refreshKey={refreshKey} />
    </div>
  );
}
