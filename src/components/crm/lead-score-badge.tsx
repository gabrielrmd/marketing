import { Badge } from "@/components/ui/badge";
import { getScoreLevel } from "@/lib/crm/scoring";
import type { LeadScoreLevel } from "@/lib/crm/types";

type Props = {
  score: number;
  purchased?: boolean;
  className?: string;
};

const LEVEL_CONFIG: Record<
  LeadScoreLevel,
  { label: string; className: string }
> = {
  cold: {
    label: "Cold",
    className: "bg-muted text-muted-foreground border-border",
  },
  warm: {
    label: "Warm",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800",
  },
  hot: {
    label: "Hot",
    className: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
  },
  customer: {
    label: "Customer",
    className: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
  },
};

export function LeadScoreBadge({ score, purchased = false, className }: Props) {
  const level = getScoreLevel(score, purchased);
  const config = LEVEL_CONFIG[level];

  return (
    <Badge
      variant="outline"
      className={`${config.className} ${className ?? ""}`}
    >
      {score} · {config.label}
    </Badge>
  );
}
