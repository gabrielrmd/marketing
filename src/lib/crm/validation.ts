// Pure validation functions for CRM entities — no "use server"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateContact(input: { email: string }): string[] {
  const errors: string[] = [];
  if (!input.email?.trim()) {
    errors.push("Email is required");
  } else if (!EMAIL_REGEX.test(input.email.trim())) {
    errors.push("Email must be a valid email address");
  }
  return errors;
}

export function validateNote(input: { content: string }): string[] {
  const errors: string[] = [];
  if (!input.content?.trim()) errors.push("Content is required");
  return errors;
}

export function validateTask(input: { title: string }): string[] {
  const errors: string[] = [];
  if (!input.title?.trim()) errors.push("Title is required");
  return errors;
}
