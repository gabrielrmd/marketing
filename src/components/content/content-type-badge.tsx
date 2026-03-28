import { CONTENT_TYPES } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import type { ContentTypeId } from "@/lib/content/types";

export function ContentTypeBadge({ type }: { type: ContentTypeId }) {
  const ct = CONTENT_TYPES.find((t) => t.id === type);
  if (!ct) return null;
  return <Badge variant="secondary" className="text-xs" style={{ borderColor: ct.color, color: ct.color }}>{ct.label}</Badge>;
}
