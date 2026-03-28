"use client";

import {
  DndContext,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CalendarItem } from "./calendar-item";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ContentItem } from "@/lib/content/types";
import type { CalendarView } from "@/lib/content/queries";
import Link from "next/link";

type ContentCalendarProps = {
  items: ContentItem[];
  view: CalendarView;
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onViewChange: (view: CalendarView) => void;
  onReschedule: (itemId: string, newDate: string) => void;
};

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const VIEWS: CalendarView[] = ["month", "week", "day"];

function getDaysInMonth(date: Date): Date[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = (firstDay.getDay() + 6) % 7;
  const days: Date[] = [];
  for (
    let i = -startPad;
    i <= lastDay.getDate() + (6 - ((lastDay.getDay() + 6) % 7)) - 1;
    i++
  ) {
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

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getItemsForDay(items: ContentItem[], day: Date): ContentItem[] {
  return items.filter((item) => {
    const date = item.scheduled_at ?? item.published_at;
    if (!date) return false;
    return isSameDay(new Date(date), day);
  });
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function formatWeekRange(days: Date[]): string {
  const first = days[0];
  const last = days[6];
  const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${first.toLocaleDateString("en-US", options)} – ${last.toLocaleDateString("en-US", { ...options, year: "numeric" })}`;
}

function formatDayHeading(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function navigate(view: CalendarView, date: Date, direction: -1 | 1): Date {
  const d = new Date(date);
  if (view === "month") {
    d.setMonth(d.getMonth() + direction);
  } else if (view === "week") {
    d.setDate(d.getDate() + direction * 7);
  } else {
    d.setDate(d.getDate() + direction);
  }
  return d;
}

export function ContentCalendar({
  items,
  view,
  currentDate,
  onDateChange,
  onViewChange,
  onReschedule,
}: ContentCalendarProps) {
  const today = new Date();

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // over.id encodes the target date as an ISO string when dropped on a day cell
    const targetDate = over.id as string;
    if (/^\d{4}-\d{2}-\d{2}/.test(targetDate)) {
      onReschedule(active.id as string, targetDate);
    }
  }

  // ── Month view ──────────────────────────────────────────────────────────────
  function renderMonthView() {
    const days = getDaysInMonth(currentDate);
    const currentMonth = currentDate.getMonth();

    return (
      <div className="flex-1 overflow-auto">
        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 border-b">
          {DAYS_OF_WEEK.map((d) => (
            <div
              key={d}
              className="py-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 flex-1">
          {days.map((day, idx) => {
            const isCurrentMonth = day.getMonth() === currentMonth;
            const isToday = isSameDay(day, today);
            const dayItems = getItemsForDay(items, day);
            const dayKey = day.toISOString().slice(0, 10);

            return (
              <div
                key={idx}
                id={dayKey}
                className={cn(
                  "min-h-[120px] border-b border-r p-1.5 flex flex-col gap-1",
                  !isCurrentMonth && "bg-muted/30",
                  idx % 7 === 0 && "border-l"
                )}
              >
                <span
                  className={cn(
                    "text-xs font-medium self-start w-6 h-6 flex items-center justify-center rounded-full",
                    isToday
                      ? "bg-primary text-primary-foreground"
                      : isCurrentMonth
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {day.getDate()}
                </span>
                <SortableContext
                  items={dayItems.map((i) => i.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {dayItems.map((item) => (
                    <CalendarItem key={item.id} item={item} />
                  ))}
                </SortableContext>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Week view ───────────────────────────────────────────────────────────────
  function renderWeekView() {
    const days = getDaysInWeek(currentDate);

    return (
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-7 border-b">
          {days.map((day, idx) => {
            const isToday = isSameDay(day, today);
            return (
              <div
                key={idx}
                className="py-2 text-center border-r last:border-r-0"
              >
                <div className="text-xs text-muted-foreground uppercase tracking-wider">
                  {DAYS_OF_WEEK[idx]}
                </div>
                <div
                  className={cn(
                    "mx-auto mt-1 w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium",
                    isToday && "bg-primary text-primary-foreground"
                  )}
                >
                  {day.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-7 flex-1">
          {days.map((day, idx) => {
            const dayItems = getItemsForDay(items, day);
            const dayKey = day.toISOString().slice(0, 10);

            return (
              <div
                key={idx}
                id={dayKey}
                className="min-h-[400px] border-r last:border-r-0 p-1.5 flex flex-col gap-1"
              >
                <SortableContext
                  items={dayItems.map((i) => i.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {dayItems.map((item) => (
                    <CalendarItem key={item.id} item={item} />
                  ))}
                </SortableContext>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Day view ────────────────────────────────────────────────────────────────
  function renderDayView() {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const dayItems = getItemsForDay(items, currentDate);
    const dayKey = currentDate.toISOString().slice(0, 10);

    function getItemHour(item: ContentItem): number {
      const date = item.scheduled_at ?? item.published_at;
      if (!date) return 0;
      return new Date(date).getHours();
    }

    return (
      <div className="flex-1 overflow-auto" id={dayKey}>
        {hours.map((hour) => {
          const hourLabel = `${hour.toString().padStart(2, "0")}:00`;
          const hourItems = dayItems.filter((item) => getItemHour(item) === hour);

          return (
            <div key={hour} className="flex border-b min-h-[56px]">
              <div className="w-16 shrink-0 px-2 py-1 text-xs text-muted-foreground text-right border-r">
                {hourLabel}
              </div>
              <div className="flex-1 p-1 flex flex-col gap-1">
                <SortableContext
                  items={hourItems.map((i) => i.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {hourItems.map((item) => (
                    <CalendarItem key={item.id} item={item} />
                  ))}
                </SortableContext>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ── Heading ─────────────────────────────────────────────────────────────────
  function renderHeading() {
    if (view === "month") return formatMonthYear(currentDate);
    if (view === "week") return formatWeekRange(getDaysInWeek(currentDate));
    return formatDayHeading(currentDate);
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-full">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b">
          {/* Left: nav + heading */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDateChange(navigate(view, currentDate, -1))}
              aria-label="Previous"
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDateChange(navigate(view, currentDate, 1))}
              aria-label="Next"
            >
              <ChevronRight />
            </Button>
            <h2 className="font-[family-name:var(--font-oswald)] text-lg font-semibold tracking-wide ml-1">
              {renderHeading()}
            </h2>
          </div>

          {/* Right: view switcher + today + new */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDateChange(new Date())}
            >
              Today
            </Button>

            <div className="flex rounded-lg border overflow-hidden">
              {VIEWS.map((v) => (
                <button
                  key={v}
                  onClick={() => onViewChange(v)}
                  className={cn(
                    "px-3 py-1 text-xs font-medium capitalize transition-colors",
                    v === view
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-muted-foreground"
                  )}
                >
                  {v}
                </button>
              ))}
            </div>

            <Link
              href="/content/new"
              className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              New
            </Link>
          </div>
        </div>

        {/* Calendar body */}
        {view === "month" && renderMonthView()}
        {view === "week" && renderWeekView()}
        {view === "day" && renderDayView()}
      </div>
    </DndContext>
  );
}
