export type Pillar = { id: string; label: string; color: string };
export type Channel = { id: string; label: string; mode: "direct" | "prep_export" };
export type FunnelStage = { id: string; label: string; order: number };
export type ContentType = { id: string; label: string; color: string };

export const AU_PILLARS: Pillar[] = [
  { id: "library", label: "Unplugged Library", color: "var(--au-teal)" },
  { id: "challenge", label: "90-Day Challenge", color: "var(--au-green)" },
  { id: "circle", label: "Unplugged Circle", color: "var(--au-orange)" },
  { id: "stage", label: "Unplugged Stage", color: "var(--au-yellow)" },
  { id: "summit", label: "Summit & Pop-Ups", color: "var(--au-teal)" },
  { id: "stories", label: "Unplugged Stories", color: "var(--au-green)" },
];

export const AU_CHANNELS: Channel[] = [
  { id: "linkedin", label: "LinkedIn", mode: "direct" },
  { id: "email", label: "Email", mode: "direct" },
  { id: "youtube", label: "YouTube", mode: "prep_export" },
  { id: "instagram", label: "Instagram", mode: "prep_export" },
  { id: "blog", label: "Blog", mode: "direct" },
  { id: "podcast", label: "Podcast", mode: "prep_export" },
];

export const FUNNEL_STAGES: FunnelStage[] = [
  { id: "visitor", label: "Visitor", order: 0 },
  { id: "subscriber", label: "Subscriber", order: 1 },
  { id: "engaged", label: "Engaged", order: 2 },
  { id: "challenge_participant", label: "Challenge Participant", order: 3 },
  { id: "circle_member", label: "Circle Member", order: 4 },
  { id: "strategy_customer", label: "AI Strategy Builder Customer", order: 5 },
  { id: "advocate", label: "Advocate", order: 6 },
];

export const CONTENT_TYPES: ContentType[] = [
  { id: "educational", label: "Educational", color: "var(--au-teal)" },
  { id: "promotional", label: "Promotional", color: "var(--au-orange)" },
  { id: "community", label: "Community", color: "var(--au-green)" },
  { id: "storytelling", label: "Storytelling", color: "var(--au-yellow)" },
];
