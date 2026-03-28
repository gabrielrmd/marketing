import { describe, it, expect } from "vitest";
import { buildCalendarQuery, getDateRange } from "@/lib/content/queries";

describe("getDateRange", () => {
  it("returns month range for month view", () => {
    const { start, end } = getDateRange("month", new Date("2026-03-15"));
    expect(start.toISOString()).toBe("2026-03-01T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-03-31T23:59:59.999Z");
  });

  it("returns week range for week view", () => {
    const { start, end } = getDateRange("week", new Date("2026-03-18"));
    expect(start.getDay()).toBe(1);
    expect(end.getDay()).toBe(0);
  });

  it("returns single day for day view", () => {
    const { start, end } = getDateRange("day", new Date("2026-03-15"));
    expect(start.toISOString()).toBe("2026-03-15T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-03-15T23:59:59.999Z");
  });
});

describe("buildCalendarQuery", () => {
  it("returns base filter with date range", () => {
    const query = buildCalendarQuery(
      new Date("2026-03-01T00:00:00.000Z"),
      new Date("2026-03-31T23:59:59.999Z"),
      {}
    );
    expect(query.from).toBe("2026-03-01T00:00:00.000Z");
    expect(query.to).toBe("2026-03-31T23:59:59.999Z");
    expect(query.channels).toBeUndefined();
  });

  it("includes channel filter when provided", () => {
    const query = buildCalendarQuery(
      new Date("2026-03-01T00:00:00.000Z"),
      new Date("2026-03-31T23:59:59.999Z"),
      { channels: ["linkedin", "email"] }
    );
    expect(query.channels).toEqual(["linkedin", "email"]);
  });
});
