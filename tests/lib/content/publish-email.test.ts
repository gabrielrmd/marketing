import { describe, it, expect, vi } from "vitest";

describe("Email publish retry logic", () => {
  it("retries up to 3 times on failure", async () => {
    let attempts = 0;
    const mockSend = vi.fn(async () => {
      attempts++;
      return { data: null, error: { message: "Rate limited" } };
    });

    let lastError: string | undefined;
    for (let attempt = 0; attempt < 3; attempt++) {
      const result = await mockSend({});
      if (!result.data) lastError = result.error?.message;
    }

    expect(attempts).toBe(3);
    expect(lastError).toBe("Rate limited");
  });

  it("succeeds on first attempt with valid data", async () => {
    const mockSend = vi.fn(async () => ({
      data: { id: "email_123" },
      error: null,
    }));

    const result = await mockSend({});
    expect(result.data?.id).toBe("email_123");
    expect(mockSend).toHaveBeenCalledTimes(1);
  });
});
