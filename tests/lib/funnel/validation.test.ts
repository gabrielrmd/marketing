import { describe, it, expect } from "vitest";
import {
  validateLandingPage,
  validateLeadMagnet,
  validateSequence,
  validateSequenceStep,
  validateFormSubmission,
} from "@/lib/funnel/validation";

describe("validateLandingPage", () => {
  it("returns error when title is missing", () => {
    const errors = validateLandingPage({ title: "", slug: "my-page" });
    expect(errors).toContain("Title is required");
  });

  it("returns error when slug is missing", () => {
    const errors = validateLandingPage({ title: "My Page", slug: "" });
    expect(errors).toContain("Slug is required");
  });

  it("returns error when slug contains invalid characters", () => {
    const errors = validateLandingPage({ title: "My Page", slug: "My Page!" });
    expect(errors).toContain("Slug must be URL-safe (lowercase letters, numbers, hyphens only)");
  });

  it("accepts slug with hyphens and numbers", () => {
    const errors = validateLandingPage({ title: "My Page", slug: "my-page-123" });
    expect(errors).toHaveLength(0);
  });

  it("returns error for slug with uppercase letters", () => {
    const errors = validateLandingPage({ title: "My Page", slug: "MyPage" });
    expect(errors).toContain("Slug must be URL-safe (lowercase letters, numbers, hyphens only)");
  });

  it("returns no errors for valid input", () => {
    const errors = validateLandingPage({ title: "Landing Page", slug: "landing-page" });
    expect(errors).toHaveLength(0);
  });

  it("returns multiple errors when both fields are missing", () => {
    const errors = validateLandingPage({ title: "", slug: "" });
    expect(errors).toContain("Title is required");
    expect(errors).toContain("Slug is required");
  });
});

describe("validateLeadMagnet", () => {
  it("returns error when title is missing", () => {
    const errors = validateLeadMagnet({ title: "" });
    expect(errors).toContain("Title is required");
  });

  it("returns error for whitespace-only title", () => {
    const errors = validateLeadMagnet({ title: "   " });
    expect(errors).toContain("Title is required");
  });

  it("returns no errors for valid title", () => {
    const errors = validateLeadMagnet({ title: "My Lead Magnet" });
    expect(errors).toHaveLength(0);
  });
});

describe("validateSequence", () => {
  it("returns error when name is missing", () => {
    const errors = validateSequence({ name: "" });
    expect(errors).toContain("Name is required");
  });

  it("returns error for whitespace-only name", () => {
    const errors = validateSequence({ name: "   " });
    expect(errors).toContain("Name is required");
  });

  it("returns no errors for valid name", () => {
    const errors = validateSequence({ name: "Welcome Sequence" });
    expect(errors).toHaveLength(0);
  });
});

describe("validateSequenceStep", () => {
  it("returns error when email step has no subject", () => {
    const errors = validateSequenceStep({ step_type: "email", subject: "", delay_minutes: null });
    expect(errors).toContain("Subject is required for email steps");
  });

  it("accepts email step with valid subject", () => {
    const errors = validateSequenceStep({ step_type: "email", subject: "Welcome!", delay_minutes: null });
    expect(errors).toHaveLength(0);
  });

  it("returns error when delay step has no delay_minutes", () => {
    const errors = validateSequenceStep({ step_type: "delay", subject: null, delay_minutes: null });
    expect(errors).toContain("Delay minutes must be a positive number for delay steps");
  });

  it("returns error when delay step has zero delay_minutes", () => {
    const errors = validateSequenceStep({ step_type: "delay", subject: null, delay_minutes: 0 });
    expect(errors).toContain("Delay minutes must be a positive number for delay steps");
  });

  it("returns error when delay step has negative delay_minutes", () => {
    const errors = validateSequenceStep({ step_type: "delay", subject: null, delay_minutes: -5 });
    expect(errors).toContain("Delay minutes must be a positive number for delay steps");
  });

  it("accepts delay step with positive delay_minutes", () => {
    const errors = validateSequenceStep({ step_type: "delay", subject: null, delay_minutes: 60 });
    expect(errors).toHaveLength(0);
  });

  it("accepts condition step with no subject or delay requirements", () => {
    const errors = validateSequenceStep({ step_type: "condition", subject: null, delay_minutes: null });
    expect(errors).toHaveLength(0);
  });
});

describe("validateFormSubmission", () => {
  it("returns error when email is missing", () => {
    const errors = validateFormSubmission({ email: "" });
    expect(errors).toContain("Email is required");
  });

  it("returns error for invalid email format", () => {
    const errors = validateFormSubmission({ email: "not-an-email" });
    expect(errors).toContain("Email must be a valid email address");
  });

  it("returns error for email without domain", () => {
    const errors = validateFormSubmission({ email: "user@" });
    expect(errors).toContain("Email must be a valid email address");
  });

  it("returns no errors for valid email", () => {
    const errors = validateFormSubmission({ email: "user@example.com" });
    expect(errors).toHaveLength(0);
  });

  it("returns no errors for email with subdomain", () => {
    const errors = validateFormSubmission({ email: "user@mail.example.co.uk" });
    expect(errors).toHaveLength(0);
  });
});
