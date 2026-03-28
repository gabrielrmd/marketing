"use client";

import { LandingPageEditor } from "@/components/funnel/landing-page-editor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { calculateABTestSignificance, calculateConversionRate } from "@/lib/funnel/stats";
import type { LandingPage, PageBlock } from "@/lib/funnel/types";

type ABTestPanelProps = {
  page: LandingPage;
  variantBBlocks: PageBlock[];
  onVariantBChange: (blocks: PageBlock[]) => void;
  onToggleTest: (active: boolean) => void;
  onSelectWinner: (winner: "a" | "b") => void;
};

export function ABTestPanel({
  page,
  variantBBlocks,
  onVariantBChange,
  onToggleTest,
  onSelectWinner,
}: ABTestPanelProps) {
  const { ab_test_active, visitors_a, visitors_b, conversions_a, conversions_b } = page;

  const rateA = calculateConversionRate(conversions_a, visitors_a);
  const rateB = calculateConversionRate(conversions_b, visitors_b);
  const significance = calculateABTestSignificance(
    conversions_a,
    visitors_a,
    conversions_b,
    visitors_b
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="font-[family-name:var(--font-oswald)] text-lg">
            A/B Test
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {ab_test_active ? "Active" : "Inactive"}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={ab_test_active}
              onClick={() => onToggleTest(!ab_test_active)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                ab_test_active ? "bg-au-teal" : "bg-muted"
              }`}
              style={{ backgroundColor: ab_test_active ? "var(--au-teal)" : undefined }}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                  ab_test_active ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          {/* Variant A */}
          <div className="rounded-lg border p-4 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Variant A (Original)
            </p>
            <p className="text-2xl font-[family-name:var(--font-oswald)] font-bold tabular-nums">
              {visitors_a.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">visitors</p>
            <p className="text-sm">
              {conversions_a.toLocaleString()} conversions &mdash;{" "}
              <span className="font-semibold">{rateA.toFixed(1)}%</span>
            </p>
          </div>

          {/* Variant B */}
          <div className="rounded-lg border p-4 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Variant B
            </p>
            <p className="text-2xl font-[family-name:var(--font-oswald)] font-bold tabular-nums">
              {visitors_b.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">visitors</p>
            <p className="text-sm">
              {conversions_b.toLocaleString()} conversions &mdash;{" "}
              <span className="font-semibold">{rateB.toFixed(1)}%</span>
            </p>
          </div>
        </div>

        {/* Significance */}
        <div className="flex items-center gap-3 rounded-lg border px-4 py-3">
          <div
            className={`h-2.5 w-2.5 rounded-full shrink-0 ${
              significance.significant ? "bg-green-500" : "bg-muted-foreground"
            }`}
          />
          <p className="text-sm">
            {significance.significant ? (
              <>
                <span className="font-semibold">
                  Variant {significance.winner?.toUpperCase()} is winning
                </span>{" "}
                with {significance.confidence.toFixed(1)}% confidence.
              </>
            ) : (
              <>
                Not yet significant &mdash; {significance.confidence.toFixed(1)}% confidence.{" "}
                <span className="text-muted-foreground">Need more data.</span>
              </>
            )}
          </p>
        </div>

        {/* Select Winner */}
        {ab_test_active && (
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelectWinner("a")}
              type="button"
            >
              Select A as Winner
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelectWinner("b")}
              type="button"
            >
              Select B as Winner
            </Button>
          </div>
        )}

        {/* Variant B editor */}
        {ab_test_active && (
          <div className="space-y-3">
            <h3 className="font-[family-name:var(--font-oswald)] text-base font-semibold">
              Variant B Content
            </h3>
            <LandingPageEditor blocks={variantBBlocks} onChange={onVariantBChange} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
