"use client";

import { FunnelChart } from "@/components/funnel/funnel-chart";
import { ConversionStats } from "@/components/funnel/conversion-stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type OverviewData = {
  landingPages: { total: number; published: number };
  leadMagnets: { total: number; totalDownloads: number };
  sequences: { active: number };
  formSubmissions: { total: number };
  contactsByStage: Record<string, number>;
};

type OverviewClientProps = {
  data: OverviewData;
};

export function OverviewClient({ data }: OverviewClientProps) {
  return (
    <div className="space-y-8">
      <ConversionStats
        totalPages={data.landingPages.total}
        publishedPages={data.landingPages.published}
        totalMagnets={data.leadMagnets.total}
        totalDownloads={data.leadMagnets.totalDownloads}
        activeSequences={data.sequences.active}
        totalSubmissions={data.formSubmissions.total}
      />

      <Card>
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-oswald)] text-lg">
            Contact Funnel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FunnelChart stageDistribution={data.contactsByStage} />
        </CardContent>
      </Card>
    </div>
  );
}
