"use client";

import { useState, useTransition } from "react";
import { ContentCalendar } from "@/components/content/content-calendar";
import { ChannelSelector } from "@/components/content/channel-selector";
import { getContentItems, rescheduleContentItem } from "@/lib/content/actions";
import { getDateRange, type CalendarView } from "@/lib/content/queries";
import type { ContentItem, ChannelId } from "@/lib/content/types";

export function CalendarClient({ initialItems }: { initialItems: ContentItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [view, setView] = useState<CalendarView>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [channelFilter, setChannelFilter] = useState<ChannelId | null>(null);
  const [, startTransition] = useTransition();

  function refresh(date: Date, v: CalendarView, channel: ChannelId | null) {
    startTransition(async () => {
      const { start, end } = getDateRange(v, date);
      const result = await getContentItems({
        from: start.toISOString(),
        to: end.toISOString(),
        ...(channel ? { channels: [channel] } : {}),
      });
      if (result.data) setItems(result.data as ContentItem[]);
    });
  }

  function handleDateChange(date: Date) {
    setCurrentDate(date);
    refresh(date, view, channelFilter);
  }

  function handleViewChange(v: CalendarView) {
    setView(v);
    refresh(currentDate, v, channelFilter);
  }

  function handleChannelFilter(c: ChannelId) {
    const newFilter = channelFilter === c ? null : c;
    setChannelFilter(newFilter);
    refresh(currentDate, view, newFilter);
  }

  function handleReschedule(itemId: string, newDate: string) {
    startTransition(async () => {
      await rescheduleContentItem(itemId, newDate);
      refresh(currentDate, view, channelFilter);
    });
  }

  return (
    <>
      <ChannelSelector value={channelFilter} onChange={handleChannelFilter} />
      <ContentCalendar
        items={items}
        view={view}
        currentDate={currentDate}
        onDateChange={handleDateChange}
        onViewChange={handleViewChange}
        onReschedule={handleReschedule}
      />
    </>
  );
}
