import { describe, it, expect } from "vitest";
import {
  validateContact,
  validateNote,
  validateTask,
} from "@/lib/crm/validation";

// ─── validateContact ──────────────────────────────────────────────────────────

describe("validateContact", () => {
  it("returns error when email is missing", () => {
    const errors = validateContact({ email: "" });
    expect(errors).toContain("Email is required");
  });

  it("returns error for whitespace-only email", () => {
    const errors = validateContact({ email: "   " });
    expect(errors).toContain("Email is required");
  });

  it("returns error for invalid email format", () => {
    const errors = validateContact({ email: "not-an-email" });
    expect(errors).toContain("Email must be a valid email address");
  });

  it("returns error for email missing domain", () => {
    const errors = validateContact({ email: "test@" });
    expect(errors).toContain("Email must be a valid email address");
  });

  it("returns error for email missing @", () => {
    const errors = validateContact({ email: "testexample.com" });
    expect(errors).toContain("Email must be a valid email address");
  });

  it("returns no errors for a valid email", () => {
    const errors = validateContact({ email: "test@example.com" });
    expect(errors).toHaveLength(0);
  });

  it("returns no errors for email with subdomain", () => {
    const errors = validateContact({ email: "user@mail.example.com" });
    expect(errors).toHaveLength(0);
  });

  it("returns no errors for email with plus addressing", () => {
    const errors = validateContact({ email: "user+tag@example.com" });
    expect(errors).toHaveLength(0);
  });
});

// ─── validateNote ─────────────────────────────────────────────────────────────

describe("validateNote", () => {
  it("returns error when content is missing", () => {
    const errors = validateNote({ content: "" });
    expect(errors).toContain("Content is required");
  });

  it("returns error for whitespace-only content", () => {
    const errors = validateNote({ content: "   " });
    expect(errors).toContain("Content is required");
  });

  it("returns no errors for valid content", () => {
    const errors = validateNote({ content: "This is a note." });
    expect(errors).toHaveLength(0);
  });

  it("returns no errors for a single character", () => {
    const errors = validateNote({ content: "a" });
    expect(errors).toHaveLength(0);
  });
});

// ─── validateTask ─────────────────────────────────────────────────────────────

describe("validateTask", () => {
  it("returns error when title is missing", () => {
    const errors = validateTask({ title: "" });
    expect(errors).toContain("Title is required");
  });

  it("returns error for whitespace-only title", () => {
    const errors = validateTask({ title: "   " });
    expect(errors).toContain("Title is required");
  });

  it("returns no errors for valid title", () => {
    const errors = validateTask({ title: "Follow up with prospect" });
    expect(errors).toHaveLength(0);
  });

  it("returns no errors for minimal valid title", () => {
    const errors = validateTask({ title: "x" });
    expect(errors).toHaveLength(0);
  });
});
