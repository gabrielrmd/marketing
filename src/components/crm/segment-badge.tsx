import { Badge } from "@/components/ui/badge";
import type { Segment } from "@/lib/crm/types";

type Props = {
  segment: Pick<Segment, "name" | "is_preset">;
  className?: string;
};

export function SegmentBadge({ segment, className }: Props) {
  const colorClass = segment.is_preset
    ? "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-800"
    : "bg-muted text-muted-foreground border-border";

  return (
    <Badge variant="outline" className={`text-xs ${colorClass} ${className ?? ""}`}>
      {segment.name}
    </Badge>
  );
}
