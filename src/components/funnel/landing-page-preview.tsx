"use client";

import { LandingPageBlock } from "@/components/funnel/landing-page-block";
import type { PageBlock } from "@/lib/funnel/types";

type LandingPagePreviewProps = {
  blocks: PageBlock[];
};

export function LandingPagePreview({ blocks }: LandingPagePreviewProps) {
  return (
    <div className="relative">
      <span className="absolute -top-3 left-3 z-10 bg-background px-2 text-xs font-medium text-muted-foreground border rounded">
        Preview
      </span>
      <div className="border rounded-lg overflow-hidden" style={{ height: "480px" }}>
        <div
          style={{
            transform: "scale(0.5)",
            transformOrigin: "top left",
            width: "200%",
            height: "200%",
            pointerEvents: "none",
          }}
        >
          {blocks.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-xl">
              Add blocks to preview your page.
            </div>
          ) : (
            <div>
              {blocks.map((block) => (
                <LandingPageBlock key={block.id} block={block} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
