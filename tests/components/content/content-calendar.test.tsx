import { describe, it, expect } from "vitest";

function getDaysInMonth(date: Date): Date[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = (firstDay.getDay() + 6) % 7;
  const days: Date[] = [];
  for (let i = -startPad; i <= lastDay.getDate() + (6 - ((lastDay.getDay() + 6) % 7)) - 1; i++) {
    days.push(new Date(year, month, i + 1));
  }
  return days;
}

function getDaysInWeek(date: Date): Date[] {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

describe("getDaysInMonth", () => {
  it("returns all days for March 2026 padded to full weeks", () => {
    const days = getDaysInMonth(new Date(2026, 2, 1));
    expect(days.length % 7).toBe(0);
    expect(days[0].getDay()).toBe(1);
  });
});

describe("getDaysInWeek", () => {
  it("returns 7 days starting from Monday", () => {
    const days = getDaysInWeek(new Date(2026, 2, 18));
    expect(days).toHaveLength(7);
    expect(days[0].getDay()).toBe(1);
    expect(days[6].getDay()).toBe(0);
  });
});
