import type { CalendarFilters } from "./types";

export type CalendarView = "month" | "week" | "day";

export function getDateRange(view: CalendarView, date: Date): { start: Date; end: Date } {
  const start = new Date(date);
  const end = new Date(date);

  switch (view) {
    case "month":
      start.setUTCDate(1);
      start.setUTCHours(0, 0, 0, 0);
      end.setUTCMonth(end.getUTCMonth() + 1, 0);
      end.setUTCHours(23, 59, 59, 999);
      break;
    case "week": {
      const day = start.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      start.setDate(start.getDate() + diff);
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case "day":
      start.setUTCHours(0, 0, 0, 0);
      end.setUTCHours(23, 59, 59, 999);
      break;
  }

  return { start, end };
}

export function buildCalendarQuery(from: Date, to: Date, filters: CalendarFilters) {
  return {
    from: from.toISOString(),
    to: to.toISOString(),
    channels: filters.channels ?? undefined,
    pillars: filters.pillars ?? undefined,
    contentTypes: filters.contentTypes ?? undefined,
    statuses: filters.statuses ?? undefined,
  };
}
