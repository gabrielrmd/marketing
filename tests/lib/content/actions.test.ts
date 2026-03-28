import { describe, it, expect } from "vitest";
import { validateContentItem, prepareContentForSave } from "@/lib/content/validation";

describe("validateContentItem", () => {
  it("returns errors for missing title", () => {
    const errors = validateContentItem({ title: "", channel: "linkedin", content_type: "educational" });
    expect(errors).toContain("Title is required");
  });

  it("returns errors for missing channel", () => {
    const errors = validateContentItem({ title: "Test", channel: "" as import("@/lib/content/types").ChannelId, content_type: "educational" });
    expect(errors).toContain("Channel is required");
  });

  it("returns empty array for valid input", () => {
    const errors = validateContentItem({ title: "Test Post", channel: "linkedin", content_type: "educational" });
    expect(errors).toHaveLength(0);
  });

  it("validates scheduled_at is in the future", () => {
    const past = new Date("2020-01-01").toISOString();
    const errors = validateContentItem({ title: "Test", channel: "linkedin", content_type: "educational", scheduled_at: past });
    expect(errors).toContain("Scheduled date must be in the future");
  });
});

describe("prepareContentForSave", () => {
  it("extracts plain text from tiptap JSON body", () => {
    const body = {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "Hello world" }] }],
    };
    const result = prepareContentForSave({ body });
    expect(result.body_text).toBe("Hello world");
  });

  it("handles empty body", () => {
    const result = prepareContentForSave({ body: {} });
    expect(result.body_text).toBe("");
  });
});
