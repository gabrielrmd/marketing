import { describe, it, expect } from "vitest";
import { AU_PILLARS, AU_CHANNELS, FUNNEL_STAGES, CONTENT_TYPES } from "@/lib/constants";

describe("AU Constants", () => {
  it("has 6 content pillars", () => {
    expect(AU_PILLARS).toHaveLength(6);
    expect(AU_PILLARS.map((p) => p.id)).toEqual([
      "library", "challenge", "circle", "stage", "summit", "stories",
    ]);
  });

  it("has all publishing channels", () => {
    expect(AU_CHANNELS.map((c) => c.id)).toEqual([
      "linkedin", "email", "youtube", "instagram", "blog", "podcast",
    ]);
  });

  it("has funnel stages in order", () => {
    expect(FUNNEL_STAGES.map((s) => s.id)).toEqual([
      "visitor", "subscriber", "engaged", "challenge_participant",
      "circle_member", "strategy_customer", "advocate",
    ]);
  });

  it("has content types", () => {
    expect(CONTENT_TYPES.map((t) => t.id)).toEqual([
      "educational", "promotional", "community", "storytelling",
    ]);
  });

  it("channels specify publishing mode", () => {
    const linkedin = AU_CHANNELS.find((c) => c.id === "linkedin");
    expect(linkedin?.mode).toBe("direct");

    const youtube = AU_CHANNELS.find((c) => c.id === "youtube");
    expect(youtube?.mode).toBe("prep_export");
  });
});
