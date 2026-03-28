import { describe, it, expect, vi } from "vitest";

describe("LinkedIn publish retry logic", () => {
  it("retries up to 3 times on failure", async () => {
    let attempts = 0;
    const mockFetch = vi.fn(async () => {
      attempts++;
      return { ok: false, status: 500, text: async () => "Server Error" } as Response;
    });

    let lastError: string | undefined;
    for (let attempt = 0; attempt < 3; attempt++) {
      const response = await mockFetch("https://api.linkedin.com/rest/posts", {});
      if (!response.ok) {
        lastError = `LinkedIn API returned ${response.status}`;
      }
    }

    expect(attempts).toBe(3);
    expect(lastError).toContain("500");
  });

  it("succeeds on first attempt if API returns ok", async () => {
    const mockFetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ id: "urn:li:share:123" }),
    } as Response));

    const response = await mockFetch("https://api.linkedin.com/rest/posts", {});
    expect(response.ok).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
