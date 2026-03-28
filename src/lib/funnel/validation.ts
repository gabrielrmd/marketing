const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLandingPage(input: { title: string; slug: string }): string[] {
  const errors: string[] = [];
  if (!input.title?.trim()) errors.push("Title is required");
  if (!input.slug?.trim()) {
    errors.push("Slug is required");
  } else if (!SLUG_REGEX.test(input.slug)) {
    errors.push("Slug must be URL-safe (lowercase letters, numbers, hyphens only)");
  }
  return errors;
}

export function validateLeadMagnet(input: { title: string }): string[] {
  const errors: string[] = [];
  if (!input.title?.trim()) errors.push("Title is required");
  return errors;
}

export function validateSequence(input: { name: string }): string[] {
  const errors: string[] = [];
  if (!input.name?.trim()) errors.push("Name is required");
  return errors;
}

export function validateSequenceStep(input: {
  step_type: string;
  subject: string | null;
  delay_minutes: number | null;
}): string[] {
  const errors: string[] = [];
  if (input.step_type === "email") {
    if (!input.subject?.trim()) errors.push("Subject is required for email steps");
  }
  if (input.step_type === "delay") {
    if (input.delay_minutes == null || input.delay_minutes <= 0) {
      errors.push("Delay minutes must be a positive number for delay steps");
    }
  }
  return errors;
}

export function validateFormSubmission(input: { email: string }): string[] {
  const errors: string[] = [];
  if (!input.email?.trim()) {
    errors.push("Email is required");
  } else if (!EMAIL_REGEX.test(input.email)) {
    errors.push("Email must be a valid email address");
  }
  return errors;
}
