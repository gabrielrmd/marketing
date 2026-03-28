import { getContactsByStage } from "@/lib/crm/queries";
import { PipelineClient } from "./pipeline-client";

export default async function CrmPage() {
  const result = await getContactsByStage();
  const contactsByStage = result.data ?? {};

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-oswald)] text-3xl font-bold tracking-tight">
            Pipeline
          </h1>
          <p className="text-muted-foreground">
            Drag contacts between stages to update their status.
          </p>
        </div>
      </div>

      <PipelineClient contactsByStage={contactsByStage} />
    </div>
  );
}
